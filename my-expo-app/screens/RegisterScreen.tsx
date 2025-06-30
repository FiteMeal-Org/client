import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { StackNavigationProp } from '@react-navigation/stack';
import axios from 'axios';
import { API_CONFIG } from '../config/api';

export default function RegisterScreen({ navigation }: { navigation: StackNavigationProp<any> }) {
    const [errorRegister, setErrorRegister] = useState('');
    const [name, setName] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState(new Date()); // Ganti dari age ke dateOfBirth
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [gender, setGender] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setDateOfBirth(selectedDate);
        }
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const handleRegister = async () => {
        setErrorRegister(''); // Clear error sebelum register

        // Validasi input
        if (!name.trim()) {
            setErrorRegister('Nama lengkap harus diisi');
            return;
        }

        if (!username.trim()) {
            setErrorRegister('Username harus diisi');
            return;
        }

        if (!gender) {
            setErrorRegister('Jenis kelamin harus dipilih');
            return;
        }

        if (!email.trim()) {
            setErrorRegister('Email harus diisi');
            return;
        }

        if (!password.trim()) {
            setErrorRegister('Password harus diisi');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setErrorRegister('Format email tidak valid');
            return;
        }

        if (password.length < 6) {
            setErrorRegister('Password minimal 6 karakter');
            return;
        }

        try {
            const response = await axios.post(`${API_CONFIG.BASE_URL}/api/register`, {
                name: name,
                dateOfBirth: dateOfBirth, // Kirim dateOfBirth ke backend
                gender: gender,
                username: username,
                email: email,
                password: password,
            });

            console.log('Register Success:', response.data);
            Alert.alert(
                'Registrasi Berhasil!',
                'Akun Anda telah berhasil dibuat. Silakan login untuk melanjutkan.',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.navigate('Login'),
                    },
                ]
            );
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.log('Register Error:', error.response?.data?.message);
                setErrorRegister(error.response?.data?.message || 'Registrasi gagal');
            } else {
                console.log('Register Error:', error);
                setErrorRegister('Registrasi gagal');
            }
        }
    };

    return (
        <>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
            <SafeAreaView style={styles.container}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled">
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                            <Ionicons name="arrow-back" size={24} color="#8B4A6B" />
                        </TouchableOpacity>

                        <View style={styles.logoContainer}>
                            <View style={styles.logo}>
                                <Ionicons name="restaurant" size={32} color="#8B4A6B" />
                            </View>
                        </View>
                        <Text style={styles.title}>Daftar Akun Baru</Text>
                        <Text style={styles.subtitle}>
                            Bergabunglah dengan FiteMeal untuk hidup yang lebih sehat
                        </Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        {/* Full Name */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Nama Lengkap</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons
                                    name="person-outline"
                                    size={20}
                                    color="#8B4A6B"
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Masukkan nama lengkap"
                                    placeholderTextColor="#999"
                                    value={name}
                                    onChangeText={setName}
                                    autoCapitalize="words"
                                    autoCorrect={false}
                                />
                            </View>
                        </View>

                        {/* Date of Birth (Date Input) */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Tanggal Lahir</Text>
                            <TouchableOpacity style={styles.inputWrapper} onPress={() => setShowDatePicker(true)}>
                                <Ionicons
                                    name="calendar-outline"
                                    size={20}
                                    color="#8B4A6B"
                                    style={styles.inputIcon}
                                />
                                <Text style={styles.dateText}>{formatDate(dateOfBirth)}</Text>
                                <Ionicons name="chevron-down-outline" size={20} color="#8B4A6B" />
                            </TouchableOpacity>
                            {showDatePicker && (
                                <DateTimePicker
                                    value={dateOfBirth}
                                    mode="date"
                                    display="default"
                                    onChange={handleDateChange}
                                    maximumDate={new Date()}
                                    minimumDate={new Date(1920, 0, 1)}
                                />
                            )}
                        </View>

                        {/* Gender */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Jenis Kelamin</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons
                                    name="transgender-outline"
                                    size={20}
                                    color="#8B4A6B"
                                    style={styles.inputIcon}
                                />
                                <View style={styles.pickerWrapper}>
                                    <Picker
                                        selectedValue={gender}
                                        style={styles.picker}
                                        onValueChange={(itemValue) => setGender(itemValue)}
                                        dropdownIconColor="#8B4A6B">
                                        <Picker.Item label="Pilih jenis kelamin" value="" />
                                        <Picker.Item label="Laki-laki" value="Laki-laki" />
                                        <Picker.Item label="Perempuan" value="Perempuan" />
                                    </Picker>
                                </View>
                            </View>
                        </View>

                        {/* Username */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Username</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="at-outline" size={20} color="#8B4A6B" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Masukkan username"
                                    placeholderTextColor="#999"
                                    value={username}
                                    onChangeText={setUsername}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                            </View>
                        </View>

                        {/* Email */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Email</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="mail-outline" size={20} color="#8B4A6B" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Masukkan email"
                                    placeholderTextColor="#999"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    keyboardType="email-address"
                                />
                            </View>
                        </View>

                        {/* Password */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Password</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons
                                    name="lock-closed-outline"
                                    size={20}
                                    color="#8B4A6B"
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Masukkan password"
                                    placeholderTextColor="#999"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    style={styles.eyeIcon}>
                                    <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={20} color="#8B4A6B" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Error Message */}
                        {errorRegister && (
                            <View style={styles.errorContainer}>
                                <Ionicons name="alert-circle" size={16} color="#FF4444" />
                                <Text style={styles.errorText}>{errorRegister}</Text>
                            </View>
                        )}

                        {/* Register Button */}
                        <TouchableOpacity
                            onPress={handleRegister}
                            activeOpacity={0.8}
                            style={styles.registerButtonContainer}>
                            <LinearGradient
                                colors={['#8B4A6B', '#A855F7']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.registerButton}>
                                <Text style={styles.registerButtonText}>Daftar Sekarang</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Login Section */}
                        <View style={styles.loginContainer}>
                            <Text style={styles.loginText}>Sudah punya akun? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={styles.loginLink}>Masuk di sini</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
    },
    header: {
        alignItems: 'center',
        paddingTop: 20,
        paddingBottom: 30,
        position: 'relative',
    },
    backButton: {
        position: 'absolute',
        left: 0,
        top: 20,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    logoContainer: {
        marginBottom: 24,
        marginTop: 30,
    },
    logo: {
        width: 80,
        height: 80,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#8B4A6B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2D3748',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#718096',
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 20,
    },
    form: {
        flex: 1,
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2D3748',
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
        minHeight: 56,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        paddingVertical: 16,
        fontSize: 16,
        color: '#2D3748',
    },
    dateText: {
        flex: 1,
        paddingVertical: 16,
        fontSize: 16,
        color: '#2D3748',
    },
    pickerWrapper: {
        flex: 1,
        marginLeft: -8,
    },
    picker: {
        flex: 1,
        color: '#2D3748',
    },
    eyeIcon: {
        padding: 4,
        marginLeft: 8,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        borderRadius: 8,
        padding: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    errorText: {
        color: '#DC2626',
        fontSize: 14,
        marginLeft: 8,
        flex: 1,
    },
    registerButtonContainer: {
        marginBottom: 24,
    },
    registerButton: {
        borderRadius: 12,
        paddingVertical: 18,
        alignItems: 'center',
        shadowColor: '#8B4A6B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    registerButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    termsText: {
        fontSize: 12,
        color: '#718096',
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 24,
        paddingHorizontal: 20,
    },
    termsLink: {
        color: '#8B4A6B',
        fontWeight: '500',
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 40,
    },
    loginText: {
        color: '#718096',
        fontSize: 14,
    },
    loginLink: {
        color: '#8B4A6B',
        fontWeight: 'bold',
        fontSize: 14,
    },
});
