'use strict';

angular.module('campaign').run(['Menus',
  function (Menus) {
    Menus.addMenuItem('navbar', {
      title: 'Campaigns',
      state: 'company.navbar.campaign.list',
      class: 'campaign',
      roles: ['user', 'admin'],
      position: 1
    });
  }
]);
