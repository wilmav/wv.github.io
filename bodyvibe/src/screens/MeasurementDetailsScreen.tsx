import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../theme/theme';
import { GlassCard } from '../components/GlassCard';
import { ChevronLeft, Trash2, Calendar } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import { InBodyMeasurement } from '../types';

export const MeasurementDetailsScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { measurement } = route.params as { measurement: InBodyMeasurement };
    const deleteMeasurement = useStore((state) => state.deleteMeasurement);

    const handleDelete = () => {
        deleteMeasurement(measurement.id);
        navigation.goBack();
    };

    const DetailItem = ({ label, value, unit }: { label: string, value?: number, unit: string }) => {
        if (value === undefined || value === null) return null;
        return (
            <View style={styles.itemRow}>
                <Text style={styles.itemLabel}>{label}</Text>
                <Text style={styles.itemValue}>{value} <Text style={styles.unit}>{unit}</Text></Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft color={Theme.colors.text} size={32} />
                </TouchableOpacity>
                <Text style={styles.title}>{new Date(measurement.date).toLocaleDateString('fi-FI')}</Text>
                <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
                    <Trash2 color={Theme.colors.danger} size={24} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {measurement.rawImageUri && (
                    <View style={styles.imageContainer}>
                        <Image source={{ uri: measurement.rawImageUri }} style={styles.image} resizeMode="cover" />
                    </View>
                )}

                <Text style={styles.sectionHeader}>Lihas-rasvadiagnoosi</Text>
                <GlassCard style={styles.card}>
                    <DetailItem label="Paino" value={measurement.weight} unit="kg" />
                    <DetailItem label="Luustolihasmassa" value={measurement.muscleMass} unit="kg" />
                    <DetailItem label="Rasvamassa" value={measurement.bodyFatMass} unit="kg" />
                </GlassCard>

                <Text style={styles.sectionHeader}>Kehon koostumus (tarkempi)</Text>
                <GlassCard style={styles.card}>
                    <DetailItem label="Kehon vesi" value={measurement.totalBodyWater} unit="kg" />
                    <DetailItem label="Proteiinit" value={measurement.proteins} unit="kg" />
                    <DetailItem label="Mineraalit" value={measurement.minerals} unit="kg" />
                    <DetailItem label="Rasvamassa" value={measurement.bodyFatMass} unit="kg" />
                </GlassCard>

                <Text style={styles.sectionHeader}>Terveysindeksit</Text>
                <GlassCard style={styles.card}>
                    <DetailItem label="BMI" value={measurement.bmi} unit="" />
                    <DetailItem label="Perusaineenvaihdunta (BMR)" value={measurement.bmr} unit="kcal" />
                    <DetailItem label="Vyötärö-lantiosuhde" value={measurement.waistHipRatio} unit="" />
                </GlassCard>

                <Text style={styles.sectionHeader}>Ravitsemus & Aineenvaihdunta</Text>
                <GlassCard style={styles.card}>
                    <DetailItem label="Nestemäärä" value={measurement.totalBodyWater} unit="kg" />
                    <DetailItem label="Proteiinit" value={measurement.proteins} unit="kg" />
                    <DetailItem label="Mineraalit" value={measurement.minerals} unit="kg" />
                </GlassCard>
            </ScrollView>
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
        justifyContent: 'space-between',
        padding: Theme.spacing.l,
    },
    backButton: {
        padding: Theme.spacing.xs,
    },
    deleteButton: {
        padding: Theme.spacing.xs,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Theme.colors.text,
    },
    content: {
        padding: Theme.spacing.l,
        paddingTop: 0,
    },
    imageContainer: {
        height: 200,
        borderRadius: Theme.roundness,
        overflow: 'hidden',
        marginBottom: Theme.spacing.l,
        backgroundColor: Theme.colors.card,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    sectionHeader: {
        color: Theme.colors.textDim,
        fontSize: 14,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: Theme.spacing.s,
        marginTop: Theme.spacing.m,
    },
    card: {
        padding: Theme.spacing.m,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Theme.spacing.s,
        borderBottomWidth: 1,
        borderBottomColor: Theme.colors.border,
    },
    itemLabel: {
        color: Theme.colors.textDim,
        fontSize: 16,
    },
    itemValue: {
        color: Theme.colors.text,
        fontSize: 18,
        fontWeight: '600',
    },
    unit: {
        fontSize: 14,
        color: Theme.colors.textDim,
        fontWeight: 'normal',
    },
});
