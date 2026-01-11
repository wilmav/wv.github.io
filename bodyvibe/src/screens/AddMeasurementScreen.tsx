import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { Theme } from '../theme/theme';
import { GlassCard } from '../components/GlassCard';
import { Camera as CameraIcon, FileText, ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { recognizeText, parseInBodyData } from '../utils/ocr';
import { useStore } from '../store/useStore';

export const AddMeasurementScreen = () => {
    const navigation = useNavigation<any>();
    const addMeasurement = useStore((state) => state.addMeasurement);
    const addWeightEntry = useStore((state) => state.addWeightEntry);
    const [isProcessing, setIsProcessing] = useState(false);

    const handlePickImage = async (mode: 'inbody' | 'weight') => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Lupa tarvitaan', 'Sovellus tarvitsee luvan käyttää kameraa.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            quality: 0.8,
            allowsEditing: true, // Changed to true to allow rotation/cropping
            base64: true,
        });

        if (!result.canceled) {
            processImage(result.assets[0].uri, mode);
        }
    };

    const processImage = async (uri: string, mode: 'inbody' | 'weight') => {
        setIsProcessing(true);
        try {
            const text = await recognizeText(uri);
            console.log('Recognized Text:', text);
            Alert.alert('Debug: Tunnistettu teksti', text.substring(0, 500)); // Show first 500 chars

            if (mode === 'inbody') {
                const data = parseInBodyData(text);
                if (data.weight) {
                    addMeasurement({
                        id: Date.now().toString(),
                        date: new Date().toISOString(),
                        ...data
                    });
                    Alert.alert('Valmis!', 'InBody-tiedot tallennettu.');
                    navigation.navigate('Home');
                } else {
                    Alert.alert('Virhe', 'Tietoja ei voitu lukea kuvasta. Syötä tiedot käsin tai yritä uudelleen.');
                }
            } else {
                const weightMatch = text.match(/(\d+[.,]\d+)/);
                if (weightMatch) {
                    const weight = parseFloat(weightMatch[1].replace(',', '.'));
                    addWeightEntry({
                        id: Date.now().toString(),
                        date: new Date().toISOString(),
                        weight
                    });
                    Alert.alert('Valmis!', `Paino ${weight}kg tallennettu.`);
                    navigation.navigate('Home');
                } else {
                    Alert.alert('Virhe', 'Painoa ei löytynyt kuvasta.');
                }
            }
        } catch (error) {
            // Suppress console.error to avoid RedBox
            Alert.alert('Huomio', 'Automaattinen luku ei onnistu tällä laitteella. Syötä tiedot käsin.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft color={Theme.colors.text} size={32} />
                </TouchableOpacity>
                <Text style={styles.title}>Lisää mittaus</Text>
            </View>

            <View style={styles.content}>
                {isProcessing ? (
                    <View style={styles.processing}>
                        <ActivityIndicator size="large" color={Theme.colors.primary} />
                        <Text style={styles.processingText}>Tunnistetaan tekstiä...</Text>
                    </View>
                ) : (
                    <>
                        <TouchableOpacity style={styles.option} onPress={() => handlePickImage('inbody')}>
                            <GlassCard style={styles.card}>
                                <CameraIcon color={Theme.colors.primary} size={48} />
                                <Text style={styles.optionTitle}>Ota kuva InBody-lomakkeesta</Text>
                                <Text style={styles.optionDesc}>Automaattinen tekstintunnistus</Text>
                            </GlassCard>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.option} onPress={() => handlePickImage('weight')}>
                            <GlassCard style={styles.card}>
                                <FileText color={Theme.colors.secondary} size={48} />
                                <Text style={styles.optionTitle}>Ota kuva vaa'asta</Text>
                                <Text style={styles.optionDesc}>Tunnista paino näytöstä</Text>
                            </GlassCard>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.manualOption}>
                            <Text style={styles.manualText}>Syötä tiedot käsin</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Theme.spacing.l,
        marginTop: Theme.spacing.m,
    },
    backButton: {
        marginRight: Theme.spacing.m,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Theme.colors.text,
    },
    content: {
        padding: Theme.spacing.l,
        flex: 1,
        justifyContent: 'center',
    },
    option: {
        marginBottom: Theme.spacing.l,
    },
    card: {
        alignItems: 'center',
        paddingVertical: Theme.spacing.xl,
    },
    optionTitle: {
        color: Theme.colors.text,
        fontSize: 18,
        fontWeight: '600',
        marginTop: Theme.spacing.m,
        textAlign: 'center',
    },
    optionDesc: {
        color: Theme.colors.textDim,
        fontSize: 14,
        marginTop: Theme.spacing.xs,
    },
    manualOption: {
        alignItems: 'center',
        marginTop: Theme.spacing.xl,
    },
    manualText: {
        color: Theme.colors.primary,
        fontSize: 16,
        textDecorationLine: 'underline',
    },
    processing: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    processingText: {
        color: Theme.colors.text,
        fontSize: 18,
        marginTop: Theme.spacing.m,
    },
});
