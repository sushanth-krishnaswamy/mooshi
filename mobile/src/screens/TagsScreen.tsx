import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { useAppStore } from '../store';
import { PlusCircle, Trash2 } from 'lucide-react-native';

export default function TagsScreen() {
  const { tags, fetchInitialData, addTag, deleteTag } = useAppStore();
  const [newTagName, setNewTagName] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleAddTag = () => {
    if (newTagName.trim()) {
      addTag({
        name: newTagName.trim()
      });
      setNewTagName('');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.tagItem}>
      <Text style={styles.tagName}>#{item.name}</Text>
      <TouchableOpacity onPress={() => deleteTag(item.id)} style={styles.deleteButton}>
         <Trash2 color="red" size={20} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={tags}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        numColumns={2}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="New tag name..."
          value={newTagName}
          onChangeText={setNewTagName}
          onSubmitEditing={handleAddTag}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddTag}>
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
  tagItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    margin: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tagName: {
    flex: 1,
    fontSize: 14,
    color: '#007AFF',
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