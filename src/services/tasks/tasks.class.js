const { Service } = require('feathers-sequelize');

exports.Tasks = class Tasks extends Service {
  create(data, params) {

    const { listId, text } = data;
    const complete = false;
    const taskData = {
      listId,
      text,
      complete
    };

    return super.create(taskData, params);
  }
};