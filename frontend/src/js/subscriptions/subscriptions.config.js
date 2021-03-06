function SubscriptionsConfig($stateProvider) {
  'ngInject';
console.log("subscriptions.config")
$stateProvider
.state('app.subscriptions', {
  url: '/subscriptions',
  controller: 'SubscriptionsCtrl',
  controllerAs: '$ctrl',
  templateUrl: 'subscriptions/subscriptions.html',
  title: 'subscriptions'
})
.state('app.buysubscriptions', {
  url: '/subscriptions/buy',
  controller: 'BuysubscriptionsCtrl',
  controllerAs: '$ctrl',
  templateUrl: 'subscriptions/buysubscriptions.html',
  title: 'Buy subscriptions'
})
.state('app.detailsubscriptions', {
  url: '/subscriptions/:slug',
  controller: 'DetailsSubscriptionCtrl',
  controllerAs: '$ctrl',
  templateUrl: 'subscriptions/detailsubscription.html',
  title: 'detailssubscription',
  resolve: {
    subscription: function(Subscriptions, $stateParams) {
      console.log($stateParams);
      console.log("dentro resolve subscription detaiils");
      return Subscriptions.get($stateParams.slug).then(subscription => subscription);
    }
  }
});
  
};

export default SubscriptionsConfig;
