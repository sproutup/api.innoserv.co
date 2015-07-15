/*
 * User data model
 */

var User = function(data) {
    this.data = data;
}

User.prototype.data = {}

User.getAll = function(callback) {
    callback(null, new User(data));
}

User.get = function(id, callback) {
    callback(null, new User(data));
}
