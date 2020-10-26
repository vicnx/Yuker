class LikeBtnCtrl {
    constructor(User, Yuks, $state, $scope) {
      'ngInject';
  
      this._User = User;
      this._Yuks = Yuks;
      this._$state = $state;
      this._$scope = $scope;
  
    }
  
    submit() {
      
      this.isSubmitting = true;
        console.log("Like component")
        console.log(this.yuk)
        //si al darle like tiene dislike
        if(this.yuk.disliked){
          this._Yuks.undislike(this.yuk.slug).then(
              () => {
                  console.log("estaba dislike, ahora esta like")
                this.isSubmitting = false;
                this.yuk.disliked = false;
              //   this._Yuks.like(this.yuk.slug);
                this.yuk.dislikesCount--;
                //damos like
                this._Yuks.like(this.yuk.slug).then(
                  () => {
                    this.isSubmitting = false;
                    this.yuk.liked = true;
                    this.yuk.likesCount++;
                  }
                )
          
              }
            )
        }else{
            if (!this._User.current) {
              this._$state.go('app.login'); //redirigimos a login si no hay usuario logeado
              return;
          }
        
          if (this.yuk.liked) {
            this._Yuks.unlike(this.yuk.slug).then(
              () => {
                this.isSubmitting = false;
                this.yuk.liked = false;
                this.yuk.likesCount--;
          
              }
            )
      
          } else {
            this._Yuks.like(this.yuk.slug).then(
              () => {
                this.isSubmitting = false;
                this.yuk.liked = true;
                this.yuk.likesCount++;
                // this._$scope.$broadcast('setKarma', this.yuk.author);
              }
            )
          }
        }

        // this._$scope.$broadcast('setKarma', this.yuk.author);

        
        // setTimeout(() => {
        //   var user = this.yuk.author 
        //   console.log(user);
        // }, 500);
        //scope para que actualize el karma
        // this.$onInit = () => {
        //   user = this.yuk.author 
        //   console.log(user);
        // }
        // var karma = this.yuk.author.karma +20;
        // console.log(karma);
        // this._$scope.$broadcast('setKarma', karma);
    }
  
  }
  
  let LikeBtn= {
    bindings: {
      yuk: '='
    },
    transclude: true,
    controller: LikeBtnCtrl,
    templateUrl: 'components/buttons/like-btn.html'
  };
  
  export default LikeBtn;
  