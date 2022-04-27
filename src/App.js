import React, {useEffect, useState} from 'react';
import './App.css';
import {API, Storage} from 'aws-amplify';
import {AmplifySignOut, withAuthenticator} from '@aws-amplify/ui-react';
import {listTodos} from './graphql/queries';
import {createTodo as createNoteMutation, deleteTodo as deleteNoteMutation} from './graphql/mutations';

const initialFormState = { name: '', description: '' }

function App() {
    const [notes, setNotes] = useState([]);
    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        fetchNotes();
    }, []);

    async function deleteNote({ id }) {
        const newNotesArray = notes.filter(note => note.id !== id);
        setNotes(newNotesArray);
        await API.graphql({ query: deleteNoteMutation, variables: { input: { id } }});
    }

    async function onChange(e) {
        if (!e.target.files[0]) return
        const file = e.target.files[0];
        setFormData({ ...formData, image: file.name });
        await Storage.put(file.name, file);
        await fetchNotes();
    }

    async function fetchNotes() {
        const apiData = await API.graphql({ query: listTodos });
        const notesFromAPI = apiData.data.listTodos.items;
        console.log(notesFromAPI);
        await Promise.all(notesFromAPI.map(async note => {
            if (note.image) {
                note.image = await Storage.get(note.image);
            }
            return note;
        }))
        setNotes(apiData.data.listTodos.items);
    }

    async function createNote() {
        if (!formData.name || !formData.description) return;
        await API.graphql({ query: createNoteMutation, variables: { input: formData } });
        if (formData.image) {
            formData.image = await Storage.get(formData.image);
        }
        setNotes([ ...notes, formData ]);
        setFormData(initialFormState);
    }

    return (
        <div className="App">
            <h1>My Notes App</h1>
            <input
                type="file"
                onChange={onChange}
            />
            <input
                onChange={e => setFormData({ ...formData, 'name': e.target.value})}
                placeholder="Note name"
                value={formData.name}
            />
            <input
                onChange={e => setFormData({ ...formData, 'description': e.target.value})}
                placeholder="Note description"
                value={formData.description}
            />
            <button onClick={createNote}>Create Note</button>
            <div style={{marginBottom: 30}}>
                {
                    notes.map(note => (
                        <div key={note.id || note.name}>
                            <h2>{note.name}</h2>
                            <p>{note.description}</p>
                            <button onClick={() => deleteNote(note)}>Delete note</button>
                            {
                                note.image && <img src={note.image} style={{width: 400}}/>
                            }
                        </div>
                    ))
                }
            </div>
            <AmplifySignOut />
        </div>
    );
}

export default withAuthenticator(App);