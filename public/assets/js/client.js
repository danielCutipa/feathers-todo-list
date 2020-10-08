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

<div class="row d-flex justify-content-center">
  <div class="col-lg-4">
    <form class="form-inline" id="send-list">
      <div class="form-group">
        <input type="text" name="input-add-list" class="form-control" placeholder="Create new list">
      </div>
      <button class="btn btn-primary" type="submit">Create</button>
    </form>
  </div>
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
</div>
<div class="row lists">
  
</div>
`;

const modalListHTML = `
<div class="modal fade" id="exampleModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="exampleModalLabel">Edit</h5>
        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <input type="text" name="input-edit-list" class="form-control">
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
        <button type="button" class="btn btn-primary edit-list" data-dismiss="modal">Save changes</button>
      </div>
    </div>
  </div>
</div>
`;
const modalTaskHTML = `
<div class="modal fade" id="exampleModal1" tabindex="-1" aria-labelledby="exampleModal1Label" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="exampleModal1Label">Edit</h5>
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
const addLists = list => {
  const lists = document.querySelector('.lists');
  // Escape HTML to prevent XSS attacks
  const text = escape(list.text);
  var tasks = '';
  if (list.tasks) {
    list.tasks.forEach(task => {
      tasks += `
      <li class="list-group-item d-flex justify-content-between">
        <span>${task.text}</span>
        <div>
          <button type="button" data-id="${task.id}" class="btn btn-info btn-sm edit-task-modal" data-toggle="modal" data-target="#exampleModal">edit</button>
          <button type="button" data-id="${task.id}" class="btn btn-danger btn-sm delete-task">delete</button>
        </div>
      </li>`;
    });
  }

  if (lists) {
    lists.innerHTML += `
    <div class="col-lg-4 list-id-${list.id}">
      <div class="card">
        <div class="card-body">
          <div class="d-flex">
            <h4 class="mr-auto">${text}</h4>
            <div>
              <button type="button" data-id="${list.id}" class="btn btn-info btn-sm edit-list-modal" data-toggle="modal" data-target="#exampleModal">edit</button>
              <button type="button" data-id="${list.id}" class="btn btn-danger btn-sm delete-list">delete</button>
            </div>
          </div>
          
          <div class="input-group mb-3">
            <input type="text" class="form-control" placeholder="New task">
            <div class="input-group-append">
              <button class="btn btn-primary add-task" data-id="${list.id}" type="button">Save</button>
            </div>
          </div>
          <ul class="list-group">${tasks}</ul>
        </div>
      </div>
    </div>`;
  }
};
const editLists = list => {
  const listElement = document.querySelector('.list-id-' + list.id);
  console.log(listElement);
  listElement.getElementsByTagName("h4")[0].innerHTML = list.text;
};
const removeLists = list => {
  const listElement = document.querySelector('.list-id-' + list.id);
  listElement.remove();
};
const addTasks = task => {
  // The user that sent this task (added by the populate-user hook)
  const { user = {} } = task;
  // const lists = document.querySelector('.lists');
  // // Escape HTML to prevent XSS attacks
  // const text = escape(task.text);
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
const showLists = async () => {
  document.getElementById('app').innerHTML = listsHTML;
  document.getElementById('app').innerHTML += modalListHTML;

  // Find the latest 25 lists. They will come with the newest first
  const lists = await client.service('lists').find({
    query: {
      $sort: { createdAt: -1 },
      $limit: 25
    }
  });

  // We want to show the newest message last
  lists.data.reverse().forEach(addLists);

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
    showLists();
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

addEventListener('.edit-list-modal', 'click', async (e) => {
  const id = e.target.dataset.id;
  const list = await client.service('lists').get(id);
  document.querySelector('[name="input-edit-list"]').value = list.text;
  document.querySelector('button.edit-list').setAttribute('data-id', list.id);
});
addEventListener('.edit-list', 'click', async (e) => {
  const id = e.target.dataset.id;
  const input = document.querySelector('[name="input-edit-list"]');
  await client.service('lists').update(id, {
    text: input.value
  });
});
addEventListener('.delete-list', 'click', async (e) => {
  const id = e.target.dataset.id;
  await client.service('lists').remove(id);
});


addEventListener('#send-list', 'submit', async ev => {
  const input = document.querySelector('[name="input-add-list"]');
  ev.preventDefault();
  if (input.value.length) {
    await client.service('lists').create({
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
client.service('lists').on('created', addLists);
client.service('lists').on('updated', editLists);
client.service('lists').on('removed', removeLists);

// We will also see when new users get created in real-time
client.service('users').on('created', addUser);

login();
