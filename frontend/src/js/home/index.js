import angular from 'angular';
console.log("index home")

// Create the module where our functionality can attach to
let homeModule = angular.module('app.home', []);

// Include our UI-Router config settings
import HomeConfig from './home.config';
homeModule.config(HomeConfig);


// Controllers
import HomeCtrl from './home.controller';
homeModule.controller('HomeCtrl', HomeCtrl);

// Component
import homeSliderCmp from './homeSlider.component';
homeModule.component('homeSliderCmp', homeSliderCmp);

export default homeModule;
