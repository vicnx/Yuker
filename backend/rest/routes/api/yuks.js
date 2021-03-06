var router = require('express').Router();
var mongoose = require('mongoose');
var Yuk = mongoose.model('Yuk');
var Comment = mongoose.model('Comment');
var User = mongoose.model('User');
var auth = require('../auth');
var user_utils = require('../../utils/UsersUtils');
//pROMETHEUS
let client = require('prom-client');

const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

const counterYuksEndpoint = new client.Counter({
  name: 'counterYuksEndpoint',
  help: 'The total number of processed requests to get endpoint'
});

// Preload yuk objects on routes with ':yuk'
//sirve para buscar un yuk concreto
router.param('yuk', function(req, res, next, slug) {
    Yuk.findOne({ slug: slug})
      .populate('author')
      .then(function (yuk) {
        if (!yuk) { return res.sendStatus(404); }
  
        req.yuk = yuk;
  
        return next();
      }).catch(next);
});

//aqui saca los comentarios de ese yuk
router.param('comment', function(req, res, next, id) {
    Comment.findById(id).then(function(comment){
      if(!comment) { return res.sendStatus(404); }
  
      req.comment = comment;
  
      return next();
    }).catch(next);
});

router.get('/', auth.optional, function(req, res, next) {
    counterYuksEndpoint.inc();
    var query = {};
    var limit = 20;
    var offset = 0;
  
    if(typeof req.query.limit !== 'undefined'){
      limit = req.query.limit;
    }
  
    if(typeof req.query.offset !== 'undefined'){
      offset = req.query.offset;
    }
  
    if( typeof req.query.tag !== 'undefined' ){
      query.tagList = {"$in" : [req.query.tag]};
    }
  //añadimos liked i disliked
    Promise.all([
      req.query.author ? User.findOne({username: req.query.author}) : null,
      req.query.liked ? User.findOne({username: req.query.liked}) : null,
      req.query.disliked ? User.findOne({username: req.query.disliked}) : null
    ]).then(function(results){
      var author = results[0];
      var liker = results[1];
      var disliker = results[2];
  
      if(author){
        query.author = author._id;
      }
  
      if(liker){
        query._id = {$in: liker.likes};
      } else if(req.query.liked){
        query._id = {$in: []};
      }

      if(disliker){
        query._id = {$in: disliker.dislikes};
      } else if(req.query.disliked){
        query._id = {$in: []};
      }
  
      return Promise.all([
        Yuk.find(query)
          .limit(Number(limit))
          .skip(Number(offset))
          .sort({createdAt: 'desc'})
          .populate('author')
          .exec(),
        Yuk.count(query).exec(),
        req.payload ? User.findById(req.payload.id) : null,
      ]).then(function(results){
        var yuks = results[0];
        var yuksCount = results[1];
        var user = results[2];
  
        return res.json({
          yuks: yuks.map(function(yuk){
            return yuk.toJSONFor(user);
          }),
          yuksCount: yuksCount
        });
      });
    }).catch(next);
});

router.get('/feed', auth.required, function(req, res, next) {
  var limit = 20;
  var offset = 0;

  if(typeof req.query.limit !== 'undefined'){
    limit = req.query.limit;
  }

  if(typeof req.query.offset !== 'undefined'){
    offset = req.query.offset;
  }

  User.findById(req.payload.id).then(function(user){
    if (!user) { return res.sendStatus(401); }

    Promise.all([
      Yuk.find({ author: {$in: user.following}})
        .limit(Number(limit))
        .skip(Number(offset))
        .populate('author')
        .exec(),
      Yuk.count({ author: {$in: user.following}})
    ]).then(function(results){
      var yuks = results[0];
      var yuksCount = results[1];

      return res.json({
        yuks: yuks.map(function(yuk){
          return yuk.toJSONFor(user);
        }),
        yuksCount: yuksCount
      });
    }).catch(next);
  });
});

router.post('/', auth.required, function(req, res, next) {
  User.findById(req.payload.id).then(function(user){
    console.log(user);
    if (!user) { return res.sendStatus(401); }
    var yuk = new Yuk(req.body.yuk);
    yuk.author = user;
    return yuk.save().then(function(){
      // console.log(yuk.author);
      //por cada yuk creado aumentamos un 5 el karma
      user_utils.increaseKarmaByUserId(user.id, 20); 
      return res.json({yuk: yuk.toJSONFor(user)});
    });
  }).catch(next);
});

// return a yuk
router.get('/:yuk', auth.optional, function(req, res, next) {
  Promise.all([
    req.payload ? User.findById(req.payload.id) : null,
    req.yuk.populate('author').execPopulate()
  ]).then(function(results){
    var user = results[0];
    return res.json({yuk: req.yuk.toJSONFor(user)});
  }).catch(next);
});

// update yuk
router.put('/:yuk', auth.required, function(req, res, next) {
  User.findById(req.payload.id).then(function(user){
    if(req.yuk.author._id.toString() === req.payload.id.toString()){
      if(typeof req.body.yuk.content !== 'undefined'){
        req.yuk.content = req.body.yuk.content;
      }

      if(typeof req.body.yuk.title !== 'undefined'){
        req.yuk.title = req.body.yuk.title;
      }

      if(typeof req.body.yuk.image !== 'undefined'){
        req.yuk.image = req.body.yuk.image;
      }

      if(typeof req.body.yuk.tagList !== 'undefined'){
        req.yuk.tagList = req.body.yuk.tagList
      }

      req.yuk.save().then(function(yuk){
        return res.json({yuk: yuk.toJSONFor(user)});
      }).catch(next);
    } else {
      return res.sendStatus(403);
    }
  });
});

// router.delete('/:yuk', auth.required, function(req, res, next) {
//   User.findById(req.payload.id).then(function(user){
//     if (!user) { return res.sendStatus(401); }

//     if(req.yuk.author._id.toString() === req.payload.id.toString()){
//       return req.yuk.remove().then(function(){
//         return res.sendStatus(204);
//       });
//     } else {
//       return res.sendStatus(403);
//     }
//   }).catch(next);
// });
// delete yuk
//Actualizada, borra los comments de ese Yuk antes de 
router.delete('/:yuk', auth.required,function(req, res, next) {
  User.findById(req.payload.id).then( async function(user){
    if (!user) { return res.sendStatus(401); }
    if(req.yuk.author._id.toString() === req.payload.id.toString()){
      //buscamos los comments y hacemos un map para borrarlos uno a uno. despues de borrarlos borramos el articulo
      if(req.yuk.comments.length !== 0){
        await req.yuk.comments.map((comment) =>{
          Comment.find({_id: comment}).remove().exec();
        });
      }
      return await req.yuk.remove().then(function(){
        return res.sendStatus(204);
      });
    } else {
      return res.sendStatus(403);
    }
  }).catch(next);
});

// Like an yuk
router.post('/:yuk/like', auth.required, function(req, res, next) {
  var yukId = req.yuk._id;
  console.log(req.yuk.author.username);

  User.findById(req.payload.id).then(function(user){
    if (!user) { return res.sendStatus(401); }

    return user.like(yukId).then(function(){
      return req.yuk.updateLikesCount().then(function(yuk){
        //si alguien da like a tu poost aumenta el karma del author de ese post en 20
        user_utils.increaseKarmaByNickname(req.yuk.author.username, 20); 
        //al dar like tu karma tambien aumenta en 5
        user_utils.increaseKarmaByUserId(user.id, 5); 
        return res.json({yuk: yuk.toJSONFor(user)});
      });
    });
  }).catch(next);
});

// Dislike an yuk
router.post('/:yuk/dislike', auth.required, function(req, res, next) {
  var yukId = req.yuk._id;

  User.findById(req.payload.id).then(function(user){
    if (!user) { return res.sendStatus(401); }

    return user.dislike(yukId).then(function(){
      return req.yuk.updateDisLikesCount().then(function(yuk){
        //si alguien da dislike a tu poost aumenta el karma del author de ese post en -15
        user_utils.increaseKarmaByNickname(req.yuk.author.username, -15); 
        //al dar dislikelike tu karma tambien aumenta en 5
        user_utils.increaseKarmaByUserId(user.id, 5); 
        return res.json({yuk: yuk.toJSONFor(user)});
      });
    });
  }).catch(next);
});

// Unlike an yuk
router.delete('/:yuk/like', auth.required, function(req, res, next) {
  var yukId = req.yuk._id;

  User.findById(req.payload.id).then(function (user){
    if (!user) { return res.sendStatus(401); }

    return user.unlike(yukId).then(function(){
      return req.yuk.updateLikesCount().then(function(yuk){
        //ssi alguien te quita el like que ya tenias, se te resta el karma en 20
        user_utils.increaseKarmaByNickname(req.yuk.author.username, -20); 
        //al usuario tambien se lo restamos
        user_utils.increaseKarmaByUserId(user.id, -5); 
        return res.json({yuk: yuk.toJSONFor(user)});
      });
    });
  }).catch(next);
});

// Undislike an yuk
router.delete('/:yuk/dislike', auth.required, function(req, res, next) {
  var yukId = req.yuk._id;

  User.findById(req.payload.id).then(function (user){
    if (!user) { return res.sendStatus(401); }

    return user.undislike(yukId).then(function(){
      return req.yuk.updateDisLikesCount().then(function(yuk){
        //ssi alguien te quita el dislike que ya tenias, se te suma el karma en 15 (se te devuelve el karma restado)
        user_utils.increaseKarmaByNickname(req.yuk.author.username, 15); 
        //al usuario tambien se lo restamos
        user_utils.increaseKarmaByUserId(user.id, -5); 
        return res.json({yuk: yuk.toJSONFor(user)});
      });
    });
  }).catch(next);
});

// create a new comment
router.post('/:yuk/comments', auth.required, function(req, res, next) {
  User.findById(req.payload.id).then(function(user){
    if(!user){ return res.sendStatus(401); }

    var comment = new Comment(req.body.comment);
    comment.yuk = req.yuk;
    comment.author = user;

    return comment.save().then(function(){
      // req.yuk.comments.push(comment);
      req.yuk.comments=req.yuk.comments.concat(comment);
      user_utils.increaseKarmaByUserId(user.id, 10); 
      return req.yuk.save().then(function(yuk) {
        res.json({comment: comment.toJSONFor(user)});
      });
    });
  }).catch(next);
});

router.delete('/:yuk/comments/:comment', auth.required, function(req, res, next) {
  if(req.comment.author.toString() === req.payload.id.toString()){
    req.yuk.comments.remove(req.comment._id);
    req.yuk.save()
      .then(Comment.find({_id: req.comment._id}).remove().exec())
      .then(function(){
        res.sendStatus(204);
      });
  } else {
    res.sendStatus(403);
  }
});

//comentarios del yuk
router.get('/:yuk/comments', auth.optional, function(req, res, next){
  Promise.resolve(req.payload ? User.findById(req.payload.id) : null).then(function(user){
    return req.yuk.populate({
      path: 'comments',
      populate: {
        path: 'author'
      },
      options: {
        sort: {
          createdAt: 'desc'
        }
      }
    }).execPopulate().then(function(yuk) {
      return res.json({comments: req.yuk.comments.map(function(comment){
        return comment.toJSONFor(user);
      })});
    });
  }).catch(next);
});


//obtenim les categories (tags)
router.get('/:yuk/tagList', function(req, res, next) {
  Yuks.find().distinct('tagList').then(function(tagList){
    return res.json({tagList: tagList});
  }).catch(next);
 });

module.exports = router;