import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { useAppStore } from '../store';
import { PlusCircle, Circle, CheckCircle2, Trash2 } from 'lucide-react-native';

export default function TasksScreen() {
  const { tasks, fetchInitialData, toggleTask, addTask, permanentlyDeleteTask } = useAppStore();
  const [newTaskTitle, setNewTaskTitle] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const activeTasks = tasks.filter(t => t.status !== 'deleted');

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      addTask({
        title: newTaskTitle.trim(),
        completed: false,
        status: 'active',
        tags: []
      });
      setNewTaskTitle('');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.taskItem}>
      <TouchableOpacity onPress={() => toggleTask(item.id)} style={styles.checkButton}>
        {item.completed ? (
          <CheckCircle2 color="#007AFF" size={24} />
        ) : (
          <Circle color="gray" size={24} />
        )}
      </TouchableOpacity>
      <Text style={[styles.taskTitle, item.completed && styles.taskCompleted]}>
        {item.title}
      </Text>
      <TouchableOpacity onPress={() => permanentlyDeleteTask(item.id)} style={styles.deleteButton}>
         <Trash2 color="red" size={20} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={activeTasks}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add a new task..."
          value={newTaskTitle}
          onChangeText={setNewTaskTitle}
          onSubmitEditing={handleAddTask}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddTask}>
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
    paddingBottom: 100, // Make room for input
  },
  taskItem: {
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
  checkButton: {
    marginRight: 12,
  },
  taskTitle: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  taskCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
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