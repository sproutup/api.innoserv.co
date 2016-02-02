'use strict';

angular.module('community').run(['Menus',
  function (Menus) {
    Menus.addMenuItem('topbar', {
      title: 'Product Trials',
      state: 'user.community.requests',
      class: 'community',
      roles: ['*'],
      position: 3
    });
  }
]);