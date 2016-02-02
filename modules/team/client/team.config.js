'use strict';

angular.module('team').run(['Menus',
  function (Menus) {
    Menus.addMenuItem('company.settings.menu', {
      title: 'Team',
      state: 'company.navbar.settings.team.list',
      class: '',
      roles: ['*'],
      position: 2
    });
  }
]);
