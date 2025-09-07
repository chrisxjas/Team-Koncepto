import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    Image,
    TouchableOpacity,
    Alert,
    RefreshControl,
    SafeAreaView,
} from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons'; // Ensure you have this installed
import { BASE_URL } from './config';

const DEFAULT_IMAGE_URI = 'https://via.placeholder.com/100x100.png?text=No+Image'; // Placeholder for missing images

const ViewCustomOrder = ({ route }) => {
    const navigation = useNavigation();
    const user = route.params?.user;
    const userId = user?.id;

    const [customOrders, setCustomOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!userId) {
            console.warn('No user ID passed to custom order screen.');
            setLoading(false);
            setError('User information missing. Cannot fetch orders.');
            return;
        }
        fetchCustomOrders();
    }, [userId]);

    const fetchCustomOrders = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post(`${BASE_URL}/get-custom-order.php`, { user_id: userId });

            if (response.data.success) {
                setCustomOrders(response.data.data);
                } else {
                console.warn('Custom order fetch failed:', response.data.message);
                setError(response.data.message || 'Failed to fetch custom orders.');
                setCustomOrders([]);
            }
        } catch (err) {
            console.error('Error fetching custom orders:', err);
            const errorMessage = err.message || "An unexpected error occurred.";
            setError(errorMessage);
            Alert.alert("Error", errorMessage + "\nPlease check your network connection or server.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchCustomOrders();
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toLocaleString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true,
        });
    };

    const renderOrderItem = (item, index) => {
        const itemImageUri = item.photo
            ? `${BASE_URL.replace('/api', '')}/uploads/${item.photo}`
            : DEFAULT_IMAGE_URI;

        return (
            <View key={item.item_id?.toString() || index.toString()} style={styles.itemCard}>
                <Image
                    source={{ uri: itemImageUri }}
                    style={styles.itemImage}
                    resizeMode="cover"
                    onError={(e) => console.log("Image load error:", e.nativeEvent.error)}
                />
                <View style={styles.itemDetails}>
                    <Text style={styles.itemName} numberOfLines={2}>{item.item_name || 'N/A'}</Text>
                    <Text style={styles.itemText}><Text style={styles.label}>Brand:</Text> {item.brand || 'N/A'}</Text>
                    <Text style={styles.itemText}><Text style={styles.label}>Category:</Text> {item.category_name || 'N/A'}</Text>
                    <Text style={styles.itemText}><Text style={styles.label}>Quantity:</Text> {item.quantity || 'N/A'} {item.unit || ''}</Text>
                    <Text style={styles.itemText}><Text style={styles.label}>Price:</Text> ₱{parseFloat(item.price || 0).toFixed(2)}</Text>
                    <Text style={styles.itemTotalPrice}><Text style={styles.label}>Total:</Text> ₱{parseFloat(item.total_price || 0).toFixed(2)}</Text>
                    {item.description ? (
                        <Text style={styles.itemDescription} numberOfLines={2}>
                            <Text style={styles.label}>Desc:</Text> {item.description}
                        </Text>
                    ) : null}
                </View>
            </View>
        );
    };

    const renderContent = () => {
        if (loading && !refreshing) {
            return (
                <View style={styles.centeredContent}>
                    <ActivityIndicator size="large" color="#4CAF50" />
                    <Text style={styles.loadingText}>Loading custom orders...</Text>
                </View>
            );
        }

        if (error) {
            return (
                <ScrollView
                    contentContainerStyle={styles.centeredContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4CAF50" />}
                >
                    <Ionicons name="alert-circle-outline" size={50} color="#D32F2F" />
                    <Text style={styles.errorText}>Error: {error}</Text>
                    <Text style={styles.refreshText}>Pull down to refresh</Text>
                </ScrollView>
            );
        }

        if (customOrders.length === 0) {
            return (
                <ScrollView
                    contentContainerStyle={styles.centeredContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4CAF50" />}
                >
                    <Ionicons name="archive-outline" size={50} color="#777" />
                    <Text style={styles.noOrdersText}>No custom orders found.</Text>
                    <Text style={styles.refreshText}>Pull down to refresh</Text>
                </ScrollView>
            );
        }

        return (
            <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4CAF50" />}
            >
                {customOrders.map((order) => (
                    <View key={order.order_id?.toString()} style={styles.orderCard}>
                        {/* Order Header (Table 1 equivalent) */}
                        <View style={styles.orderHeader}>
                            <Text style={styles.orderTitle}>Order #{order.order_id}</Text>
                            <Text style={styles.orderDate}>Placed: {formatDate(order.order_created_at)}</Text>
                        </View>
                        <Text style={styles.orderUpdateDate}>Last Updated: {formatDate(order.order_updated_at)}</Text>

                        {/* Order Items (Table 2 equivalent) */}
                        <View style={styles.itemsContainer}>
                            <Text style={styles.itemsSectionTitle}>Order Items</Text>
                            {order.items && order.items.length > 0 ? (
                                order.items.map(renderOrderItem)
                            ) : (
                                <Text style={styles.noItemsText}>No items found for this order.</Text>
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
                <Text style={styles.headerTitle}>My Custom Orders</Text>
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
        backgroundColor: '#e8f5e9', // Lightest green background
    },
    customHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#2e7d32', // Dark green for header
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#1b5e20',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    backButton: {
        padding: 5,
    },
    backButtonPlaceholder: { // To balance the header layout
        width: 24 + 10,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    contentArea: {
        flex: 1,
        backgroundColor: '#e8f5e9',
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
        padding: 20,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#555',
    },
    errorText: {
        color: '#D32F2F', // Red for errors
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 10,
        fontWeight: 'bold',
    },
    refreshText: {
        marginTop: 5,
        fontSize: 14,
        color: '#777',
        textAlign: 'center',
    },
    noOrdersText: {
        fontSize: 16,
        fontStyle: 'italic',
        color: '#777',
        marginTop: 10,
    },
    orderCard: {
        backgroundColor: '#ffffff',
        borderRadius: 10,
        padding: 18,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#c8e6c9', // Light green border
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
        elevation: 4,
    },
    orderHeader: {
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        paddingBottom: 10,
        marginBottom: 10,
    },
    orderTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1b5e20', // Darker green
    },
    orderDate: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    orderUpdateDate: {
        fontSize: 13,
        color: '#777',
        fontStyle: 'italic',
        marginBottom: 15,
    },
    itemsContainer: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: StyleSheet.hairlineWidth, // Thin separator
        borderTopColor: '#e0e0e0',
    },
    itemsSectionTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#2e7d32', // Dark green
        marginBottom: 10,
    },
    itemCard: {
        flexDirection: 'row',
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: '#d4edda', // Very light green border
        alignItems: 'center',
    },
    itemImage: {
        width: 70,
        height: 70,
        borderRadius: 5,
        marginRight: 10,
        backgroundColor: '#eee', // Placeholder background for image
    },
    itemDetails: {
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 2,
    },
    itemText: {
        fontSize: 13,
        color: '#555',
        marginBottom: 2,
    },
    itemTotalPrice: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1b5e20', // Dark green for total price
        marginTop: 5,
    },
    itemDescription: {
        fontSize: 12,
        color: '#777',
        fontStyle: 'italic',
        marginTop: 5,
    },
    label: {
        fontWeight: 'bold',
        color: '#1b5e20',
    },
    noItemsText: {
        fontSize: 14,
        fontStyle: 'italic',
        color: '#999',
        textAlign: 'center',
        paddingVertical: 10,
    },
    footer: {
        backgroundColor: '#2e7d32', // Dark green for footer
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

export default ViewCustomOrder;