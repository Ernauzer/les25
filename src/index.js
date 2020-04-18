'use strict';
const BASE_URL = 'https://todo.hillel.it';
const loading = document.querySelector('.loader');
const loginForm = document.querySelector('.form_login');
const content = document.querySelector('.content');
const loginEmail = document.querySelector('.form_login .email');
const loginPassword = document.querySelector('.form_login .password');
const createForm = document.querySelector('.form_create');
const createInput = document.querySelector('.form_create input');
const list = document.querySelector('.list');

const state = {
    token: '',
    notes: []
};

//Ф-кция рендер листа\\
const renderList = data => {
    // eslint-disable-next-line no-undef
    const formatDate = date => moment(date).format('DD MMM YYYY');
    list.innerHTML = '';

    data.forEach(note => {
        const li = document.createElement('li');
        li.classList.add('list_item');
        li.dataset.id = note._id;
        li.innerHTML = `
            <input type="checkbox" class="complete" ${note.checked ? 'checked' : ''}>
            <span class="note_value">${note.value}</span>
            <span class="note_add_data">${formatDate(note.addedAt)}</span>
            <div>
                <button class="remove">Remove</button>
                <button class="edit" ${note.checked ? 'disabled' : ''}>Edit</button>
            </div>
        `;

        if (note.checked) {
            li.classList.add('complete');
        }

        list.append(li);
    });
};
//Авторизация\\
loginForm.addEventListener('submit', e => {
    e.preventDefault();

    loading.classList.remove('hide');

    fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify({
            value: loginEmail.value,
            password: loginPassword.value
        })
    }).then(response => response.json())
        .then(data => {
            state.token = `Bearer ${data.access_token}`;

            loginForm.classList.add('hide');
            content.classList.remove('hide');

            fetch(`${BASE_URL}/todo`, {
                method: 'GET',
                headers: {
                    'Content-type': 'application/json',
                    'Authorization': state.token
                }
            }).then(response => response.json())
                .then(notes => {
                    state.notes = notes;
                    renderList(state.notes);
                    loading.classList.add('hide');
                });
        });

});
//Отправляем заметку и добавляем себе в масив\\
createForm.addEventListener('submit', e => {
    e.preventDefault();
    const inputValue = createInput.value.trim();
    if (inputValue !== ' ' && inputValue.length > 2) { // eslint-disable-line no-magic-numbers
        loading.classList.remove('hide');
        fetch(`${BASE_URL}/todo`, {
            method: 'POST',
            headers: {
                'Content-type': 'application/json',
                'Authorization': state.token
            },
            body: JSON.stringify({
                value: inputValue,
                priority: 1
            })
        }).then(response => response.json())
            .then(note => {
                createInput.value = '';
                state.notes.unshift(note);
                renderList(state.notes);

                loading.classList.add('hide');
            });
    }else {
        console.log('Введите больше 2 символов!!'); // eslint-disable-line no-console
    }
});
//Обработчик событий элементов формы.\\
list.addEventListener('click', ({ target }) => {
    let currentNoteId;
    let currentNoteValue;
    switch (target.className) {
    case 'remove':
    case 'edit':
    case 'complete':
    case 'cancel':
    case 'save':
        currentNoteId = +target.closest('.list_item').getAttribute('data-id');
        currentNoteValue = state.notes.find(value => value._id === currentNoteId).value;
        break;
    }

    if (target.tagName === 'BUTTON' && target.className === 'remove') {
        loading.classList.remove('hide');

        fetch(`${BASE_URL}/todo/${currentNoteId}`, {
            method: 'DELETE',
            headers: {
                'Content-type': 'application/json',
                'Authorization': state.token
            }
        }).then(response => response.json())
            .then(() => {
                state.notes = state.notes.filter(note => note._id !== currentNoteId);
                renderList(state.notes);
                console.log(state.notes); // eslint-disable-line no-console

                loading.classList.add('hide');
            });
    }
    if (target.tagName === 'INPUT' && target.className === 'complete') {
        loading.classList.remove('hide');

        fetch(`${BASE_URL}/todo/${currentNoteId}/toggle`, {

            method: 'PUT',
            headers: {
                'Content-type': 'application/json',
                'Authorization': state.token
            }
        }).then(response => response.json())
            .then(() => {
                state.notes = state.notes.map(note => ({
                    ...note,
                    checked: note._id === currentNoteId ? !note.checked : note.checked
                }));
                renderList(state.notes);

                loading.classList.add('hide');
            });
    }
    if (target.tagName === 'BUTTON' && target.className === 'edit') {
        const btnEditSave = document.createElement('button');
        const btnEditCancel = document.createElement('button');
        const inputEditInput = document.createElement('input');

        inputEditInput.setAttribute('type', 'text');
        inputEditInput.classList.add('inputEdit');
        btnEditSave.classList.add('save');
        btnEditCancel.classList.add('cancel');

        btnEditSave.textContent = 'Save';
        btnEditCancel.textContent = 'Cancel';
        inputEditInput.value = `${currentNoteValue}`;

        const listEdit = target.closest('.list_item');
        listEdit.innerHTML = '';
        listEdit.append(inputEditInput);
        listEdit.append(btnEditSave);
        listEdit.append(btnEditCancel);
    }
    if (target.tagName === 'BUTTON' && target.className === 'save') {
        const {value} = target.closest('.list_item').querySelector('.inputEdit');

        loading.classList.remove('hide');

        fetch(`${BASE_URL}/todo/${currentNoteId}`, {
            method: 'PUT',
            headers: {
                'Content-type': 'application/json',
                'Authorization': state.token
            },
            body: JSON.stringify({
                'value': value,
                'priority': 1
            })
        }).then(response => response.json())
            .then(() => {
                state.notes.find(item => {
                    // eslint-disable-next-line no-unused-expressions
                    item._id === currentNoteId
                        ? item.value = value
                        : item.value;
                });
                renderList(state.notes);
                loading.classList.add('hide');
            });
    }
    if (target.tagName === 'BUTTON' && target.className === 'cancel') {
        renderList(state.notes);
    }
});
