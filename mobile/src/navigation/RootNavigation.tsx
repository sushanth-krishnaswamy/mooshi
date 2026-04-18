import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CheckSquare, FileText, Folder, Hash } from 'lucide-react-native';

import TasksScreen from '../screens/TasksScreen';
import NotesScreen from '../screens/NotesScreen';
import FoldersScreen from '../screens/FoldersScreen';
import TagsScreen from '../screens/TagsScreen';

const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();

// Bottom tabs for main functionality
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Tasks"
        component={TasksScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <CheckSquare color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Notes"
        component={NotesScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <FileText color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Drawer navigator wraps the tabs and adds additional screens
export default function RootNavigation() {
  return (
    <NavigationContainer>
      <Drawer.Navigator
        screenOptions={{
          drawerActiveTintColor: '#007AFF',
          headerShown: true,
        }}
      >
        <Drawer.Screen
          name="Home"
          component={MainTabs}
          options={{
            drawerIcon: ({ color, size }) => <FileText color={color} size={size} />,
            title: 'Tasks & Notes'
          }}
        />
        <Drawer.Screen
          name="Folders"
          component={FoldersScreen}
          options={{
            drawerIcon: ({ color, size }) => <Folder color={color} size={size} />,
          }}
        />
        <Drawer.Screen
          name="Tags"
          component={TagsScreen}
          options={{
            drawerIcon: ({ color, size }) => <Hash color={color} size={size} />,
          }}
        />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}