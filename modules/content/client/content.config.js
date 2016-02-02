'use strict';

angular.module('content').run(['Menus',
  function (Menus) {
    Menus.addMenuItem('topbar', {
   	  title: 'Content',
      state: 'user.content',
      class: 'content',
      roles: ['*'],
      position: 4
    });
  }
]);