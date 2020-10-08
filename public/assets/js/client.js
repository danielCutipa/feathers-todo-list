// Establish a Socket.io connection
const socket = io();
// Initialize our Feathers client application through Socket.io
// with hooks and authentication.
const client = feathers();

client.configure(feathers.socketio(socket));
// Use localStorage to store our login token
client.configure(feathers.authentication());

// Login screen
const loginHTML = `<main class="login container">
  <div class="row my-5">
    <div class="col text-center">
      <h1 class="font-100">Log in or signup</h1>
      <div class="error-message text-danger"></div>
    </div>
  </div>
  <div class="row d-flex justify-content-center">
    <div class="col-lg-4">

      <form>
        <div class="form-group">
          <input class="form-control form-control-lg" type="email" placeholder="Email" name="email">
        </div>
        <div class="form-group">
          <input class="form-control form-control-lg" type="password" placeholder="Password" name="password" >
        </div>    

        <button type="button" id="login" class="btn btn-primary btn-lg btn-block">
          Log in
        </button>

        <button type="button" id="signup" class="btn btn-primary btn-lg btn-block">
          Sign up and log in
        </button>
      </form>
    </div>
  </div>
</main>`;

// Task base HTML (without user list and tasks)
const listsHTML = `
<div class="row">
  <header class="col flex flex-row flex-center">
    <div class="block text-center my-3">
      <img class="logo" src="http://feathersjs.com/img/feathers-logo-wide.png"
        alt="Feathers Logo" width="200px">
      <h1 class="title">To do list</h1>
    </div>
  </header>
</div>


<div class="row">
  <div class="col-lg-4">
    <h4 class="text-center">
      <span class="font-600 online-count">0</span> users
    </h4>
    <ul class="list-group list-group-flush user-list"></ul>
    <a href="#" id="logout" class="btn btn-danger btn-block">
      Sign Out
    </a>
  </div>

  <div class=col-lg-8>
    <div class="row d-flex justify-content-center my-2">
      <div class="col-lg-12">
        <form class="form-inline" id="send-task">
          <div class="form-group">
            <input type="text" name="input-add-task" class="form-control" placeholder="Create new Task">
          </div>
          <button class="btn btn-primary" type="submit">Create</button>
        </form>
      </div>
    </div>

    <div class="row">
      <div class="col-lg-12">

        <div class="card">
          <div class="card-body">
            
            <h4 class="mr-auto">To Do List</h4>
            
            <div class="list-group ul-lists">
            </div>

          </div>
        </div>

      </div>
    </div>
  </div>
</div>`;

const modalListHTML = `
<div class="modal fade" id="exampleModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="exampleModalLabel">Edit Task</h5>
        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <input type="text" name="input-edit-task" class="form-control">
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
        <button type="button" class="btn btn-primary edit-task" data-dismiss="modal">Save changes</button>
      </div>
    </div>
  </div>
</div>
`;

// Helper to safely escape HTML
const escape = str => str.replace(/&/g, '&amp;')
  .replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Add a new user to the list
const addUser = user => {
  const userList = document.querySelector('.user-list');

  if (userList) {
    // Add the user to the list
    userList.innerHTML += `
    <li class="list-group-item">
      <img src="${user.avatar}" alt="" class="rounded-circle">
      <span class="absolute username">${escape(user.name || user.email)}</span>
    </li>`;

    // Update the number of users
    const userCount = document.querySelectorAll('.user-list li').length;

    document.querySelector('.online-count').innerHTML = userCount;
  }
};

// Renders a list to the page
const addTasks = task => {
  const taskList = document.querySelector('.ul-lists');
  // Escape HTML to prevent XSS attacks
  var text = escape(task.text);
  const id = task.id;

  if (task.complete) {
    text = `<s>${text}</s>`;
  } else {
    text = text;
  }

  if (taskList) {
    taskList.innerHTML += `
    <a href="#" class="list-group-item list-group-item-action d-flex justify-content-between list-id-${id}" data-id="${id}">
      <span>${text}</span>
      <div>
        <button type="button" data-id="${id}" class="btn btn-info btn-sm edit-task-modal" data-toggle="modal" data-target="#exampleModal">edit</button>
        <button type="button" data-id="${id}" class="btn btn-danger btn-sm delete-task">delete</button>
      </div>
    </a>`;
  }
};
const patchTasks = list => {
  const listElement = document.querySelector('.list-id-' + list.id);
  listElement.getElementsByTagName("span")[0].innerHTML = list.text;
};
const removeTasks = list => {
  const listElement = document.querySelector('.list-id-' + list.id);
  listElement.remove();
};

// Show the login page
const showLogin = (error) => {
  if (document.querySelectorAll('.login').length && error) {
    emptyErrorMessage(error);
  } else {
    document.getElementById('app').innerHTML = loginHTML;
  }
};

const emptyErrorMessage = (error) => {
  const divErrorMessage = document.querySelector('.error-message');
  if (divErrorMessage) {
    while (divErrorMessage.firstChild) {
      divErrorMessage.removeChild(divErrorMessage.firstChild);
    }
    divErrorMessage.insertAdjacentHTML('beforeend', `<p>There was an error: ${error.message}</p>`);
  }
}

// Shows the chat page
const showTasks = async () => {
  document.getElementById('app').innerHTML = listsHTML;
  document.getElementById('app').innerHTML += modalListHTML;

  // Find the latest 25 tasks. They will come with the newest first
  const taskList = await client.service('tasks').find({
    query: {
      $sort: { createdAt: -1 },
      $limit: 25
    }
  });

  // We want to show the newest message last
  taskList.data.reverse().forEach(addTasks);

  // Find all users
  const users = await client.service('users').find();

  // Add each user to the list
  users.data.forEach(addUser);
};

// Retrieve email/password object from the login/signup page
const getCredentials = () => {
  const user = {
    email: document.querySelector('[name="email"]').value,
    password: document.querySelector('[name="password"]').value
  };

  return user;
};

// Log in either using the given email/password or the token from storage
const login = async credentials => {
  try {
    if (!credentials) {
      // Try to authenticate using an existing token
      await client.reAuthenticate();
    } else {
      // Otherwise log in with the `local` strategy using the credentials we got
      await client.authenticate({
        strategy: 'local',
        ...credentials
      });
    }

    // If successful, show the chat page
    showTasks();
  } catch (error) {
    // If we got an error, show the login page
    showLogin(error);
  }
};

const addEventListener = (selector, event, handler) => {
  document.addEventListener(event, async ev => {
    if (ev.target.closest(selector)) {
      handler(ev);
    }
  });
};

// "Signup and login" button click handler
addEventListener('#signup', 'click', async () => {
  // For signup, create a new user and then log them in
  const credentials = getCredentials();

  if (credentials.email.length && credentials.password.length) {
    // First create the user
    await client.service('users').create(credentials);
    // If successful log them in
    await login(credentials);
  } else {
    emptyErrorMessage({ message: 'Invalid credentials' })
  }
});

// "Login" button click handler
addEventListener('#login', 'click', async () => {
  const user = getCredentials();

  await login(user);
});

// "Logout" button click handler
addEventListener('#logout', 'click', async () => {
  await client.logout();
  document.getElementById('app').innerHTML = loginHTML;
});

// toogle complete or uncomplete
addEventListener('.list-group-item-action', 'click', async (e) => {
  try {
    const id = e.target.dataset.id;
    const task = await client.service('tasks').get(id);
    const nose = await client.service('tasks').patch(id, {
      text: task.text,
      complete: task.complete ? 0 : 1
    });
    var text = escape(task.text);

    if (task.complete) {
      text = `<s>${text}</s>`;
    } else {
      text = text;
    }
    e.target.getElementsByTagName("span")[0].innerHTML = text;
  } catch (error) { }
});
addEventListener('.edit-task-modal', 'click', async (e) => {
  const id = e.target.dataset.id;
  const task = await client.service('tasks').get(id);
  document.querySelector('[name="input-edit-task"]').value = task.text;
  document.querySelector('button.edit-task').setAttribute('data-id', task.id);
});
addEventListener('.edit-task', 'click', async (e) => {
  const id = e.target.dataset.id;
  const input = document.querySelector('[name="input-edit-task"]');
  await client.service('tasks').patch(id, {
    text: input.value
  });
});
addEventListener('.delete-task', 'click', async (e) => {
  const id = e.target.dataset.id;
  await client.service('tasks').remove(id);
});


addEventListener('#send-task', 'submit', async ev => {
  const input = document.querySelector('[name="input-add-task"]');
  ev.preventDefault();
  if (input.value.length) {
    await client.service('tasks').create({
      text: input.value
    });
    input.value = '';
  }
});

addEventListener('.add-task', 'click', async ev => {
  const input = ev.target.parentNode.parentNode.querySelector('input');
  const listId = ev.target.dataset.id;
  ev.preventDefault();
  if (input.value.length) {
    await client.service('tasks').create({
      text: input.value,
      listId: listId
    });
    input.value = '';
  }
});

// Listen to created events and add the new task and list in real-time
client.service('tasks').on('created', addTasks);
client.service('tasks').on('patched', patchTasks);
client.service('tasks').on('removed', removeTasks);

// We will also see when new users get created in real-time
client.service('users').on('created', addUser);

login();
