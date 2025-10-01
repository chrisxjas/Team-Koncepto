import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    Image,
    TouchableOpacity,
    Linking,
    RefreshControl,
    Alert,
    SafeAreaView, // Import SafeAreaView for proper layout on modern devices
} from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native'; // Import useNavigation hook
import Ionicons from 'react-native-vector-icons/Ionicons'; // Import icon library for back button
import { BASE_URL } from '../config';

const Receipt = ({ route }) => {
    // Get navigation object from React Navigation
    const navigation = useNavigation();

    // Extract user object and user ID from navigation route params
    const user = route.params?.user;
    const userId = user?.id;

    // State variables for managing data, loading, refreshing, and errors
    const [receipts, setReceipts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    // useEffect hook to fetch data when the component mounts or userId changes
    useEffect(() => {
        if (!userId) {
            console.warn('No user ID passed to receipt screen. Cannot fetch receipts.');
            setLoading(false);
            setError('User information missing. Please log in again.');
            return;
        }
        fetchPayments(); // Initial data fetch
    }, [userId]);

    // Function to handle fetching payments from the backend
    const fetchPayments = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post(`${BASE_URL}/get-receipt.php`, { user_id: userId });

            if (response.data.status === 'success') {
                setReceipts(response.data.data);
            } else {
                setError(response.data.message || 'Failed to fetch receipts.');
                setReceipts([]);
            }
        } catch (err) {
            setError(err.message || "An unexpected error occurred while fetching receipts.");
            Alert.alert("Error", (err.message || "Network error") + "\nPlease check your network connection or server.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Handler for pull-to-refresh action
    const onRefresh = () => {
        setRefreshing(true); // Activate refreshing indicator
        fetchPayments();      // Re-fetch payments
    };

    // Helper function to format dates for display
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date'; // Check for invalid date

        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    };

    // Render logic based on loading, error, and data states
    const renderContent = () => {
        if (loading && !refreshing) {
            return (
                <View style={styles.centeredContent}>
                    <ActivityIndicator size="large" color="#4CAF50" />
                    <Text style={styles.loadingText}>Loading receipts...</Text>
                </View>
            );
        }

        if (error) {
            return (
                <ScrollView
                    contentContainerStyle={styles.centeredContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4CAF50" />}
                >
                    <Text style={styles.errorText}>Error: {error}</Text>
                    <Text style={styles.refreshText}>Pull down to refresh</Text>
                </ScrollView>
            );
        }

        if (receipts.length === 0) {
            return (
                <ScrollView
                    contentContainerStyle={styles.centeredContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4CAF50" />}
                >
                    <Text style={styles.noReceipt}>No receipts found.</Text>
                    <Text style={styles.refreshText}>Pull down to refresh</Text>
                </ScrollView>
            );
        }

        // Main render for displaying the list of receipts
        return (
            <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4CAF50" />}
            >
                {receipts.map((item) => (
                    <View key={item.payment_id?.toString() || Math.random().toString()} style={styles.receiptCard}>
                        <View style={styles.receiptHeader}>
                            <Text style={styles.receiptTitle}>Payment ID: {item.payment_id}</Text>
                            <Text style={[
                                styles.receiptStatus,
                                styles[`status_${item.payment_status?.toLowerCase()}`]
                            ]}>
                                {item.payment_status}
                            </Text>
                        </View>
                        <View style={styles.receiptBody}>
                            <Text style={styles.receiptText}><Text style={styles.label}>Order ID:</Text> {item.order_id || 'N/A'}</Text>
                            <Text style={styles.receiptText}><Text style={styles.label}>Customer:</Text> {item.first_name} {item.last_name}</Text>
                            <Text style={styles.receiptText}><Text style={styles.label}>Email:</Text> {item.email || 'N/A'}</Text>
                            <Text style={styles.receiptText}><Text style={styles.label}>Payment Method:</Text> {item.payment_method || 'N/A'}</Text>
                            <Text style={styles.receiptText}><Text style={styles.label}>Order Type:</Text> {item.order_type || 'N/A'}</Text>
                            <Text style={styles.receiptText}><Text style={styles.label}>Payment Date:</Text> {formatDate(item.payment_date || item.created_at)}</Text>
                            <Text style={styles.receiptText}><Text style={styles.label}>Order Date:</Text> {formatDate(item.Orderdate)}</Text>
                            <Text style={styles.receiptText}><Text style={styles.label}>Ship Date:</Text> {formatDate(item.Shipdate)}</Text>
                            <Text style={styles.receiptText}><Text style={styles.label}>Order Status:</Text> {item.order_status || 'N/A'}</Text>

                            {item.payment_proof && (
                                <TouchableOpacity
                                    style={styles.imageContainer}
                                    onPress={() => Linking.openURL(`${BASE_URL.replace('/api', '')}/uploads/${item.payment_proof}`)}
                                >
                                    <Text style={styles.label}>Payment Proof:</Text>
                                    <Image
                                        source={{ uri: `${BASE_URL.replace('/api', '')}/uploads/${item.payment_proof}` }}
                                        style={styles.image}
                                        resizeMode="contain"
                                    />
                                    <Text style={styles.viewProofText}>Tap to View Full Proof</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                ))}
            </ScrollView>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Custom Header */}
            <View style={styles.customHeader}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Payment Receipts</Text>
                <View style={styles.backButtonPlaceholder} /> {/* Placeholder for alignment */}
            </View>

            {/* Main Content Area */}
            <View style={styles.contentArea}>
                {renderContent()}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>© Koncepto App 2025</Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#e8f5e9', // Light green for the entire screen background
    },
    customHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#2e7d32', // Darker green for header
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#1b5e20',
        elevation: 5, // Android shadow
        shadowColor: '#000', // iOS shadow
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    backButton: {
        padding: 5,
    },
    backButtonPlaceholder: { // To balance the header layout
        width: 24 + 10, // Icon size + padding
    },
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    contentArea: {
        flex: 1, // Takes up remaining space between header and footer
        backgroundColor: '#e8f5e9', // Matches safeArea background
    },
    scrollContainer: {
        flex: 1,
        backgroundColor: '#e8f5e9',
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 20,
    },
    centeredContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#e8f5e9',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#555',
    },
    errorText: {
        color: '#d32f2f',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 10,
    },
    refreshText: {
        marginTop: 5,
        fontSize: 14,
        color: '#777',
        textAlign: 'center',
    },
    noReceipt: {
        fontSize: 16,
        fontStyle: 'italic',
        color: '#777',
        marginTop: 10,
    },
    receiptCard: {
        backgroundColor: '#ffffff',
        borderRadius: 10,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#c8e6c9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
        elevation: 4,
    },
    receiptHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        paddingBottom: 10,
    },
    receiptTitle: {
        fontWeight: 'bold',
        fontSize: 19,
        color: '#2e7d32',
    },
    receiptStatus: {
        fontWeight: 'bold',
        fontSize: 15,
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 20,
        color: '#fff',
        backgroundColor: '#4CAF50',
        textTransform: 'uppercase',
    },
    status_pending: {
        backgroundColor: '#ffc107', // Amber for pending
        color: '#333',
    },
    status_completed: {
        backgroundColor: '#4CAF50', // Green for completed
    },
    status_failed: {
        backgroundColor: '#f44336', // Red for failed
    },
    status_cancelled: {
        backgroundColor: '#9e9e9e', // Gray for cancelled
    },
    receiptBody: {
        marginTop: 5,
    },
    receiptText: {
        fontSize: 15,
        color: '#424242',
        marginBottom: 8,
        lineHeight: 22,
    },
    label: {
        fontWeight: 'bold',
        color: '#1b5e20',
    },
    imageContainer: {
        marginTop: 15,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        padding: 5,
        backgroundColor: '#fcfcfc',
    },
    image: {
        height: 180,
        width: '100%',
        borderRadius: 6,
    },
    viewProofText: {
        marginTop: 8,
        fontSize: 13,
        color: '#1976d2',
        textDecorationLine: 'underline',
    },
    footer: {
        backgroundColor: '#2e7d32', // Darker green for footer
        paddingVertical: 12,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#1b5e20',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 }, // Shadow pointing upwards
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    footerText: {
        color: '#fff',
        fontSize: 14,
    },
});

export default Receipt;