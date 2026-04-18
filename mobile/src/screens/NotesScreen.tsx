import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAppStore } from '../store';
import { PlusCircle, Trash2, X } from 'lucide-react-native';

export default function NotesScreen() {
  const { notes, fetchInitialData, addNote, deleteNote, updateNote } = useAppStore();
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [noteContent, setNoteContent] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const activeNotes = notes.filter(n => n.status !== 'deleted');

  const handleAddNote = async () => {
    if (newNoteTitle.trim()) {
      const id = await addNote({
        title: newNoteTitle.trim(),
        content: '',
        status: 'active',
        tags: []
      });
      setNewNoteTitle('');

      const newNote = notes.find(n => n.id === id) || { id, title: newNoteTitle.trim(), content: '' };
      setSelectedNote(newNote);
      setNoteContent('');
      setIsModalVisible(true);
    }
  };

  const handleOpenNote = (note) => {
    setSelectedNote(note);
    setNoteContent(note.content || '');
    setIsModalVisible(true);
  };

  const handleSaveNote = async () => {
    if (selectedNote) {
      await updateNote(selectedNote.id, { content: noteContent });
      setIsModalVisible(false);
      setSelectedNote(null);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.noteItem} onPress={() => handleOpenNote(item)}>
      <View style={styles.noteContent}>
        <Text style={styles.noteTitle}>{item.title || 'Untitled Note'}</Text>
        <Text style={styles.notePreview} numberOfLines={2}>
          {item.content ? item.content.replace(/<[^>]*>?/gm, '') : 'Empty note'}
        </Text>
      </View>
      <TouchableOpacity onPress={() => deleteNote(item.id)} style={styles.deleteButton}>
         <Trash2 color="red" size={20} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={activeNotes}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="New note title..."
          value={newNoteTitle}
          onChangeText={setNewNoteTitle}
          onSubmitEditing={handleAddNote}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddNote}>
          <PlusCircle color="#007AFF" size={32} />
        </TouchableOpacity>
      </View>

      <Modal visible={isModalVisible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedNote?.title}</Text>
            <TouchableOpacity onPress={handleSaveNote}>
              <X color="#333" size={24} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            <TextInput
              style={styles.editorInput}
              multiline
              placeholder="Write your note here..."
              value={noteContent}
              onChangeText={setNoteContent}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100, // Make room for input
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  noteContent: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  notePreview: {
    fontSize: 14,
    color: '#666',
  },
  deleteButton: {
    padding: 4,
    marginLeft: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderColor: '#eee',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    marginRight: 12,
  },
  addButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#eee',
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBody: {
    flex: 1,
    padding: 16,
  },
  editorInput: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    minHeight: 200,
    textAlignVertical: 'top',
  },
});