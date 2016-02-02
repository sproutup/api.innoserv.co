'use strict';

angular.module('campaign').run(['Menus',
  function (Menus) {
    Menus.addMenuItem('company.campaign.menu', {
      title: 'Manage Templates',
      state: 'company.navbar.template.list',
      class: 'campaign',
      roles: ['admin'],
      position: 10
    });
  }
]);
