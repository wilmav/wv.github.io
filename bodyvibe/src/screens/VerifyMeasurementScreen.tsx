import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Image, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../theme/theme';
import { GlassCard } from '../components/GlassCard';
import { ChevronLeft, Save, X } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import { InBodyMeasurement } from '../types';

export const VerifyMeasurementScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { scannedData, imageUri } = route.params || {};
    const addMeasurement = useStore((state) => state.addMeasurement);

    const [form, setForm] = useState<Partial<InBodyMeasurement>>({
        weight: scannedData?.weight,
        muscleMass: scannedData?.muscleMass,
        bodyFatMass: scannedData?.bodyFatMass,
        bodyFatPercent: scannedData?.bodyFatPercent,
        visceralFat: scannedData?.visceralFat,
        bmi: scannedData?.bmi,
        bmr: scannedData?.bmr,
        totalBodyWater: scannedData?.totalBodyWater,
        proteins: scannedData?.proteins,
        minerals: scannedData?.minerals,
        waistHipRatio: scannedData?.waistHipRatio,
    });

    const [showImage, setShowImage] = useState(false);
    const [showRawText, setShowRawText] = useState(false);
    const rawText = route.params?.rawText || '';

    const handleChange = (key: keyof InBodyMeasurement, value: string) => {
        // Allow empty string or numbers
        if (value === '' || /^\d*[.,]?\d*$/.test(value)) {
            setForm(prev => ({ ...prev, [key]: value.replace(',', '.') }));
        }
    };

    const handleSave = () => {
        if (!form.weight) {
            Alert.alert('Virhe', 'Paino on pakollinen tieto.');
            return;
        }

        const cleanNumber = (val: any) => {
            if (typeof val === 'number') return val;
            if (typeof val === 'string') {
                const parsed = parseFloat(val.replace(',', '.'));
                return isNaN(parsed) ? undefined : parsed;
            }
            return undefined;
        };

        const measurement: InBodyMeasurement = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            rawImageUri: imageUri,
            weight: cleanNumber(form.weight) || 0,
            muscleMass: cleanNumber(form.muscleMass) || 0,
            bodyFatMass: cleanNumber(form.bodyFatMass),
            bodyFatPercent: cleanNumber(form.bodyFatPercent) || 0,
            visceralFat: cleanNumber(form.visceralFat) || 0,
            bmi: cleanNumber(form.bmi),
            bmr: cleanNumber(form.bmr),
            totalBodyWater: cleanNumber(form.totalBodyWater),
            proteins: cleanNumber(form.proteins),
            minerals: cleanNumber(form.minerals),
            waistHipRatio: cleanNumber(form.waistHipRatio)
        };

        addMeasurement(measurement);
        Alert.alert(
            'Tallennettu!',
            `Mittaus lisätty:\nPaino: ${measurement.weight}kg\nLihas: ${measurement.muscleMass}kg\nRasva%: ${measurement.bodyFatPercent}%`,
            [
                { text: 'OK', onPress: () => navigation.navigate('Home') }
            ]
        );
    };

    const Field = ({ label, fieldKey, unit }: { label: string, fieldKey: keyof InBodyMeasurement, unit: string }) => (
        <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <View style={styles.inputWrapper}>
                <TextInput
                    style={styles.input}
                    value={form[fieldKey]?.toString() || ''}
                    onChangeText={(text) => handleChange(fieldKey, text)}
                    keyboardType="numeric"
                    placeholder="--"
                    placeholderTextColor={Theme.colors.textDim}
                />
                <Text style={styles.unit}>{unit}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft color={Theme.colors.text} size={32} />
                </TouchableOpacity>
                <Text style={styles.title}>Tarkista tiedot</Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {imageUri && (
                        <View style={styles.imageSection}>
                            <View style={styles.debugRow}>
                                <TouchableOpacity onPress={() => setShowImage(!showImage)} style={styles.debugBtn}>
                                    <Text style={styles.toggleImageText}>
                                        {showImage ? 'Piilota kuva' : 'Näytä kuva'}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setShowRawText(!showRawText)} style={styles.debugBtn}>
                                    <Text style={styles.debugBtnText}>
                                        {showRawText ? 'Piilota raaka-data' : 'Näytä raaka-data'}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Debug: Show what we actually parsed */}
                            {Object.keys(form).length === 0 && (
                                <View style={[styles.card, { borderColor: 'red', borderWidth: 1 }]}>
                                    <Text style={{ color: 'red' }}>Varoitus: Yhtään tietoa ei tunnistettu automaattisesti.</Text>
                                    <Text style={styles.textDim}>Tarkista "Näytä raaka-data" nähdäksesi mitä kamera näki.</Text>
                                </View>
                            )}

                            {showImage && (
                                <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
                            )}
                            {showRawText && (
                                <GlassCard style={styles.rawTextCard}>
                                    <Text style={styles.sectionHeader}>Tunnistetut arvot:</Text>
                                    <Text style={styles.textDim}>
                                        {JSON.stringify(form, null, 2)}
                                    </Text>
                                    <Text style={[styles.sectionHeader, { marginTop: 10 }]}>Kameran tekstidata:</Text>
                                    <ScrollView style={{ maxHeight: 300 }}>
                                        <Text style={styles.rawText}>{rawText}</Text>
                                    </ScrollView>
                                </GlassCard>
                            )}
                        </View>
                    )}

                    <Text style={styles.sectionHeader}>Kehon koostumus</Text>
                    <GlassCard style={styles.formCard}>
                        <Field label="Paino" fieldKey="weight" unit="kg" />
                        <Field label="Lihasmassa" fieldKey="muscleMass" unit="kg" />
                        <Field label="Rasvamassa" fieldKey="bodyFatMass" unit="kg" />
                        <Field label="Rasvaprosentti" fieldKey="bodyFatPercent" unit="%" />
                        <Field label="Viskeraalirasva" fieldKey="visceralFat" unit="" />
                    </GlassCard>

                    <Text style={styles.sectionHeader}>Muut arvot</Text>
                    <GlassCard style={styles.formCard}>
                        <Field label="BMI" fieldKey="bmi" unit="" />
                        <Field label="BMR (kcal)" fieldKey="bmr" unit="kcal" />
                        <Field label="Nestemäärä" fieldKey="totalBodyWater" unit="kg" />
                    </GlassCard>

                    <Text style={styles.sectionHeader}>Lisätiedot</Text>
                    <GlassCard style={styles.formCard}>
                        <Field label="Proteiinit" fieldKey="proteins" unit="kg" />
                        <Field label="Mineraalit" fieldKey="minerals" unit="kg" />
                        <Field label="Vyötärö-lantio" fieldKey="waistHipRatio" unit="" />
                    </GlassCard>

                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
                            <X color={Theme.colors.text} size={24} />
                            <Text style={styles.cancelText}>Peruuta</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                            <Save color={Theme.colors.background} size={24} />
                            <Text style={styles.saveText}>Tallenna</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>
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
        paddingHorizontal: Theme.spacing.l,
        paddingVertical: Theme.spacing.m,
    },
    backButton: {
        marginRight: Theme.spacing.m,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Theme.colors.text,
    },
    scrollContent: {
        padding: Theme.spacing.l,
    },
    imageSection: {
        marginBottom: Theme.spacing.l,
        alignItems: 'center',
    },
    debugRow: {
        flexDirection: 'row',
        gap: Theme.spacing.l,
        marginBottom: Theme.spacing.s,
    },
    debugBtn: {
        padding: Theme.spacing.s,
    },
    toggleImageText: {
        color: Theme.colors.primary,
        fontSize: 16,
    },
    previewImage: {
        width: '100%',
        height: 300,
        borderRadius: Theme.roundness,
        backgroundColor: '#000',
        marginBottom: Theme.spacing.m,
    },
    debugBtnText: {
        color: Theme.colors.primary,
        fontSize: 14,
        fontWeight: 'bold',
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    textDim: {
        color: Theme.colors.textDim,
        fontSize: 14,
        marginTop: 4,
    },
    rawTextCard: {
        padding: Theme.spacing.m,
        width: '100%',
        maxHeight: 200,
        marginTop: Theme.spacing.s,
    },
    rawText: {
        color: Theme.colors.textDim,
        fontSize: 12,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    sectionHeader: {
        color: Theme.colors.textDim,
        fontSize: 14,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: Theme.spacing.s,
        marginTop: Theme.spacing.m,
    },
    formCard: {
        padding: Theme.spacing.m,
    },
    fieldContainer: {
        marginBottom: Theme.spacing.m,
    },
    fieldLabel: {
        color: Theme.colors.text,
        fontSize: 16,
        marginBottom: Theme.spacing.xs,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: Theme.colors.border,
        paddingBottom: Theme.spacing.xs,
    },
    input: {
        flex: 1,
        color: Theme.colors.primary,
        fontSize: 20,
        fontWeight: '600',
        padding: 0,
    },
    unit: {
        color: Theme.colors.textDim,
        fontSize: 16,
        marginLeft: Theme.spacing.s,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: Theme.spacing.xl,
    },
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Theme.spacing.m,
    },
    cancelText: {
        color: Theme.colors.text,
        fontSize: 18,
        marginLeft: Theme.spacing.s,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.colors.primary,
        paddingVertical: Theme.spacing.m,
        paddingHorizontal: Theme.spacing.xl,
        borderRadius: Theme.roundness,
    },
    saveText: {
        color: Theme.colors.background,
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: Theme.spacing.s,
    },
});
