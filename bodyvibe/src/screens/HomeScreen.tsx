import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../theme/theme';
import { GlassCard } from '../components/GlassCard';
import { Activity, Weight, Zap, Plus } from 'lucide-react-native';
import { useStore } from '../store/useStore';
import { useNavigation } from '@react-navigation/native';

export const HomeScreen = () => {
    const navigation = useNavigation<any>();
    const { measurements, weightEntries, isLoading } = useStore();
    const latest = measurements[0];
    const latestWeight = weightEntries[0];

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Image
                        source={require('../../assets/logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text style={styles.title}>BodyVibe</Text>
                </View>

                <GlassCard style={styles.mainCard}>
                    <View style={styles.row}>
                        <Weight color={Theme.colors.primary} size={32} />
                        <View style={styles.textStack}>
                            <Text style={styles.label}>Viimeisin paino</Text>
                            <Text style={styles.value}>
                                {latest?.weight || latestWeight?.weight || '--'} kg
                            </Text>
                        </View>
                    </View>
                </GlassCard>

                <View style={styles.grid}>
                    <GlassCard style={styles.smallCard}>
                        <Activity color={Theme.colors.secondary} size={24} />
                        <Text style={styles.smallLabel}>Lihasmassa</Text>
                        <Text style={styles.smallValue}>
                            {latest?.muscleMass ? `${latest.muscleMass} kg` : '--'}
                        </Text>
                    </GlassCard>

                    <GlassCard style={styles.smallCard}>
                        <Zap color={Theme.colors.success} size={24} />
                        <Text style={styles.smallLabel}>Rasvaprosentti</Text>
                        <Text style={styles.smallValue}>
                            {latest?.bodyFatPercent ? `${latest.bodyFatPercent}%` : '--'}
                        </Text>
                    </GlassCard>
                </View>

                {measurements.length === 0 && weightEntries.length === 0 ? (
                    <Text style={styles.dimText}>Ei vielä historiatietoja...</Text>
                ) : (
                    <Text style={styles.dimText}>Historiadataa löytyy!</Text>
                )}
            </ScrollView>
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('AddMeasurement')}
                activeOpacity={0.8}
            >
                <Plus color={Theme.colors.background} size={32} />
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    scrollContent: {
        padding: Theme.spacing.l,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Theme.spacing.xl,
    },
    logo: {
        width: 60,
        height: 60,
        marginRight: Theme.spacing.m,
        borderRadius: 12,
    },
    title: {
        fontSize: 40,
        fontWeight: '800',
        color: Theme.colors.text,
        letterSpacing: -1,
    },
    mainCard: {
        marginBottom: Theme.spacing.l,
    },
    grid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Theme.spacing.xl,
    },
    smallCard: {
        width: '48%',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    textStack: {
        marginLeft: Theme.spacing.m,
    },
    label: {
        color: Theme.colors.textDim,
        fontSize: 14,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    value: {
        color: Theme.colors.text,
        fontSize: 32,
        fontWeight: 'bold',
    },
    smallLabel: {
        color: Theme.colors.textDim,
        fontSize: 12,
        marginTop: Theme.spacing.s,
    },
    smallValue: {
        color: Theme.colors.text,
        fontSize: 20,
        fontWeight: 'bold',
    },
    sectionTitle: {
        color: Theme.colors.text,
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: Theme.spacing.m,
    },
    dimText: {
        color: Theme.colors.textDim,
        fontSize: 14,
    },
    fab: {
        position: 'absolute',
        bottom: 40,
        right: 20,
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: Theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
});
