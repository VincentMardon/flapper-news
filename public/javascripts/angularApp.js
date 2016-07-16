var app = angular.module('flapperNews', ['ui.router']);

app.config([
  '$stateProvider',
  '$urlRouterProvider',
  function($stateProvider, $urlRouterProvider){
    $stateProvider
      .state('home', {
        url: '/home',
        templateUrl: '/home.html',
        controller: 'MainController'
      })
      .state('posts', {
        url: '/posts/{id}',
        templateUrl: '/posts.html',
        controller: 'PostsController'
      });
    
    $urlRouterProvider.otherwise('home');
  }
])

app.factory('posts', [function(){
  var o = {
    posts: [
      {title: 'Post 1', upvotes: 24, comments: []},
      {title: 'Post 2', upvotes: 50, comments:[]},
      {title: 'Post 3', upvotes: 3, comments:[]},
      {title: 'Post 4', upvotes: 15, comments:[]},
      {title: 'Post 5', upvotes: 893, comments:[]},
    ]
  };
  return o;
}]);

app.controller('MainController', [
  '$scope',
  'posts',
  function($scope, posts) {
    $scope.posts = posts.posts; 
    
    $scope.addPost = function(){
      if(!$scope.title || $scope.title === '') { return; }
      
      $scope.posts.push({
        title:   $scope.title,
        link:    $scope.link,
        upvotes: 0,
        comments: [
          {author: 'Joe', body: 'Cool post!', upvotes: 0},
          {author: 'Bob', body: 'Great idea but everything is wrong!', upvotes: 0}
        ]
      });
      $scope.title = '';
      $scope.link = '';
    };
    
    $scope.incrementUpvotes = function(post) {
      post.upvotes += 1;
    };
}]);

app.controller('PostsController', [
  '$scope',
  '$stateParams',
  'posts',
  function($scope, $stateParams, posts){
    $scope.post = posts.posts[$stateParams.id];
    
    $scope.addComment = function(){
      if($scope.body === '') { return; }
      $scope.post.comments.push({
        body: $scope.body,
        author: 'user',
        upvotes: 0
      });
      $scope.body = '';
    }
    $scope.incrementUpvotes = function(comment) {
      comment.upvotes += 1;
    };
  }
]);