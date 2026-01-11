import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../theme/theme';
import { GlassCard } from '../components/GlassCard';
import { Activity, Weight, Zap } from 'lucide-react-native';

export const HomeScreen = () => {
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
                            <Text style={styles.value}>78.5 kg</Text>
                        </View>
                    </View>
                </GlassCard>

                <View style={styles.grid}>
                    <GlassCard style={styles.smallCard}>
                        <Activity color={Theme.colors.secondary} size={24} />
                        <Text style={styles.smallLabel}>Lihasmassa</Text>
                        <Text style={styles.smallValue}>35.2 kg</Text>
                    </GlassCard>

                    <GlassCard style={styles.smallCard}>
                        <Zap color={Theme.colors.success} size={24} />
                        <Text style={styles.smallLabel}>Rasvaprosentti</Text>
                        <Text style={styles.smallValue}>18.4%</Text>
                    </GlassCard>
                </View>

                <Text style={styles.sectionTitle}>Viimeaikainen kehitys</Text>
                <Text style={styles.dimText}>Ei vielä historiatietoja...</Text>
            </ScrollView>
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
});
