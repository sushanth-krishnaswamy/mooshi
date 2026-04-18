import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';

export default function App() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Note: If running on a physical device, replace localhost with your machine's local IP address
    fetch('http://localhost:8000/api/health')
      .then((response) => response.json())
      .then((data) => {
        setHealth(data.status);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setHealth('Failed to connect to backend');
        setLoading(false);
      });
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tasks & Notes Mobile App</Text>

      <View style={styles.statusContainer}>
        <Text style={styles.subtitle}>Backend Status:</Text>
        {loading ? (
          <ActivityIndicator size="small" color="#0000ff" />
        ) : (
          <Text style={styles.statusText}>{health}</Text>
        )}
      </View>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  statusContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
  },
});
