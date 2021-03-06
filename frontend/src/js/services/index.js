import angular from 'angular';

// Create the module where our functionality can attach to
let servicesModule = angular.module('app.services', []);

import GraphQLClientService from './graphql.service';
servicesModule.service('GraphQLClient', GraphQLClientService);

import SubscriptionsService from './subscription.service';
servicesModule.service('Subscriptions', SubscriptionsService);

import UserService from './user.service';
servicesModule.service('User', UserService);

import JwtService from './jwt.service'
servicesModule.service('JWT', JwtService);

import ProfileService from './profile.service';
servicesModule.service('Profile', ProfileService);

import ArticlesService from './articles.service';
servicesModule.service('Articles', ArticlesService);

import YuksService from './yuks.service';
servicesModule.service('Yuks', YuksService);

import NoticiasService from './noticias.service';
servicesModule.service('Noticias', NoticiasService);

import CommentsService from './comments.service';
servicesModule.service('Comments', CommentsService);

import TagsService from './tags.service';
servicesModule.service('Tags', TagsService);

import ToastrService from './toastr.service';
servicesModule.service('Toastr', ToastrService);


export default servicesModule;
