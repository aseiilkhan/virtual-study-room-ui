import React, { useState, useEffect } from 'react';
import './Notes.css';

function Notes() {
  const [notes, setNotes] = useState<string[]>([]);
  const [newNote, setNewNote] = useState(''); // State to store new note content

  useEffect(() => {
    const storedNotes = localStorage.getItem('notes');
    if (storedNotes) {
      setNotes(JSON.parse(storedNotes));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('notes', JSON.stringify(notes));
  }, [notes]);

  const handleAddNote = () => {
    if (newNote.trim() !== '') {
      setNotes([...notes, newNote]);
      setNewNote(''); // Clear the input after adding
    }
  };

  const handleNoteChange = (index: number, newText: string) => {
    setNotes(notes.map((note, i) => (i === index ? newText : note)));
  };

  const handleDeleteNote = (index: number) => {
    setNotes(notes.filter((_, i) => i !== index));
  };

  return (
    <div className="module">
      <div className="module-header">Notes</div>

      {/* New Note Input Area */}
      <div className="new-note">
        <textarea className='new-note-box'
          placeholder="Enter a new note..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
        />
        <button onClick={handleAddNote} className="add-button">Add</button>
      </div>

      {/* Existing Notes List */}
      <div className="notes-list">
        {notes.map((note, index) => (
          <div className="note" key={index}>
            <textarea className='note-box' readOnly={true}
              value={note} 
            />
            <button onClick={() => handleDeleteNote(index)} className="delete-button">Delete</button>
          </div>
        ))}
      </div>

    </div>
  );
}

export default Notes;

