import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { useAppStore } from '../store';
import { PlusCircle, Trash2 } from 'lucide-react-native';

export default function FoldersScreen() {
  const { folders, fetchInitialData, addFolder, deleteFolder } = useAppStore();
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleAddFolder = () => {
    if (newFolderName.trim()) {
      addFolder({
        name: newFolderName.trim()
      });
      setNewFolderName('');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.folderItem}>
      <Text style={styles.folderName}>{item.name}</Text>
      <TouchableOpacity onPress={() => deleteFolder(item.id)} style={styles.deleteButton}>
         <Trash2 color="red" size={20} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={folders}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="New folder name..."
          value={newFolderName}
          onChangeText={setNewFolderName}
          onSubmitEditing={handleAddFolder}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddFolder}>
          <PlusCircle color="#007AFF" size={32} />
        </TouchableOpacity>
      </View>
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
    paddingBottom: 100,
  },
  folderItem: {
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
  folderName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  deleteButton: {
    padding: 4,
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
});