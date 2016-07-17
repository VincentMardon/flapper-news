var app = angular.module('flapperNews', ['ui.router']);

app.config([
  '$stateProvider',
  '$urlRouterProvider',
  function($stateProvider, $urlRouterProvider){
    $stateProvider
      .state('home', {
        url: '/home',
        templateUrl: '/home.html',
        controller: 'MainController',
        resolve: {
          postPromise: ['posts', function(posts){
            return posts.getAll();
          }]
        }
      })
      .state('login', {
        url: '/login',
        templateUrl: '/login.html',
        controller: 'AuthController',
        onEnter: ['$state', 'auth', function($state, auth){
          if(auth.isLoggedIn()){
            $state.go('home');
          }
        }]
      })
      .state('register', {
        url: '/register',
        templateUrl: '/register.html',
        controller: 'AuthController',
        onEnter: ['$state', 'auth', function($state, auth){
          if(auth.isLoggedIn()){
            $state.go('home');
          }
        }]
      })
      .state('posts', {
        url: '/posts/{id}',
        templateUrl: '/posts.html',
        controller: 'PostsController',
        resolve: {
          post: ['$stateParams', 'posts', function($stateParams, posts){
            return posts.get($stateParams.id);
          }]
        }
      });
    $urlRouterProvider.otherwise('home');
  }
]);
app.factory('auth', ['$http','$window' , function($http, $window){
  var auth = {};
  auth.saveToken = function(token){
    $window.localStorage['flapper-news-token'] = token;
  };
  auth.getToken = function(){
    return $window.localStorage['flapper-news-token'];
  };
  auth.isLoggedIn = function() {
    var token = auth.getToken();
    if(token){
      var payload = JSON.parse($window.atob(token.split('.')[1]));
      return payload.exp > Date.now() / 1000;
    } else {
      return false;
    }
  };
  auth.currentUser = function(){
    if(auth.isLoggedIn()){
      var token = auth.getToken();
      var payload = JSON.parse($window.atob(token.split('.')[1]));
      return payload.username;
    }
  };
  auth.register = function(user) {
    return $http.post('/register', user).success(function(data){
      auth.saveToken(data.token);
    });
  };
  auth.logIn = function(user){
    return $http.post('/login', user).success(function(data){
      auth.saveToken(data.token);
    });
  };
  auth.logOut = function(user){
    $window.localStorage.removeItem('flapper-news-token');
  }
  return auth;
}]);
app.factory('posts', ['$http', 'auth', function($http, auth){
  var o = {
    posts: []
  };
  o.getAll = function() {
    return $http.get('/posts').success(function(data){
      angular.copy(data, o.posts);
    });
  };
  o.get = function(id) {
    return $http.get('/posts/'+id).then(function(res){
      return res.data;
    })
  }
  o.create = function(post) {
    return $http.post('/posts', post, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){
      o.posts.push(data);
    });
  };
  o.upvote = function(post) {
    return $http.put('/posts/'+post._id+'/upvote', null, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){
      post.upvotes++;
    });
  };
  o.addComment = function(id, comment) {
    return $http.post('/posts/'+id+'/comments', comment, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    });
  };
  o.upvoteComments = function(post, comment) {
    return $http.put('/posts/'+post._id+'/comments/'+comment._id+'/upvote', null, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){
      comment.upvotes++;
    });
  };
  return o;
}]);
app.controller('MainController', [
  '$scope',
  'auth',
  'posts',
  function($scope, auth, posts) {
    $scope.posts = posts.posts;
    $scope.isLoggedIn = auth.isLoggedIn;
    $scope.addPost = function(){
      if(!$scope.title || $scope.title === '') { return; }
      posts.create({
        title: $scope.title,
        link: $scope.link
      });
      $scope.title = '';
      $scope.link = '';
    };
    $scope.incrementUpvotes = function(post) {
      posts.upvote(post);
    };
}]);
app.controller('AuthController', [
  '$scope',
  '$state',
  'auth',
  function($scope, $state, auth){
    $scope.user = {};
    $scope.register = function(){
      auth.register($scope.user).error(function(err){
        $scope.error = err;
      }).then(function(){
        $state.go('home');
      });
    };
    $scope.logIn = function(){
      auth.logIn($scope.user).error(function(err){
        $scope.error = err;
      }).then(function(){
        $state.go('home');
      });
    };
  }
]);
app.controller('NavController', [
  '$scope',
  'auth',
  function($scope, auth){
    $scope.isLoggedIn = auth.isLoggedIn;
    $scope.currentUser = auth.currentUser;
    $scope.logOut = auth.logOut;
  }
]);
app.controller('PostsController', [
  '$scope',
  'auth',
  'posts',
  'post',
  function($scope, auth, posts, post){
    $scope.post = post;
    $scope.isLoggedIn = auth.isLoggedIn;
    $scope.addComment = function(){
      if($scope.body === '') { return; }
      posts.addComment(post._id, {
        body: $scope.body,
        author: auth.currentUser
      }).success(function(comment){
        $scope.post.comments.push(comment);
      });
      $scope.body = '';
    }
    $scope.incrementUpvotes = function(comment) {
      posts.upvoteComments(post, comment)
    };
  }
]);