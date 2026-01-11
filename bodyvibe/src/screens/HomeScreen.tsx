import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../theme/theme';
import { GlassCard } from '../components/GlassCard';
import { Activity, Weight, Zap, Plus, TrendingUp } from 'lucide-react-native';
import { useStore } from '../store/useStore';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export const HomeScreen = () => {
    const navigation = useNavigation<any>();
    const { measurements, weightEntries, isLoading, loadData } = useStore();
    const latest = measurements[0];
    const latestWeight = weightEntries[0];

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    // Determine the most recent weight regardless of source
    const currentWeight = latest && latestWeight
        ? (new Date(latest.date) > new Date(latestWeight.date) ? latest.weight : latestWeight.weight)
        : (latest?.weight || latestWeight?.weight);

    const [chartMetric, setChartMetric] = useState<'weight' | 'muscle' | 'fat'>('weight');

    const chartData = useMemo(() => {
        let title = 'Paino (kg)';
        let data: { date: string, value: number }[] = [];

        if (chartMetric === 'weight') {
            title = 'Painon kehitys';
            // Combine both sources
            const mixedPoints = [
                ...measurements.map(m => ({ date: m.date, value: m.weight })),
                ...weightEntries.map(w => ({ date: w.date, value: w.weight }))
            ];
            // Sort and take last 6
            data = mixedPoints
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .slice(-6);
        } else if (chartMetric === 'muscle') {
            title = 'Lihasmassa (kg)';
            data = measurements
                .map(m => ({ date: m.date, value: m.muscleMass }))
                .filter(p => p.value > 0)
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .slice(-6);
        } else {
            title = 'Rasvaprosentti (%)';
            data = measurements
                .map(m => ({ date: m.date, value: m.bodyFatPercent }))
                .filter(p => p.value > 0)
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .slice(-6);
        }

        if (data.length === 0) return null;

        return {
            labels: data.map(d => {
                const date = new Date(d.date);
                return `${date.getDate()}.${date.getMonth() + 1}.`;
            }),
            datasets: [{ data: data.map(d => d.value) }],
            title
        };
    }, [measurements, weightEntries, chartMetric]);

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Image
                        source={require('../../assets/logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text style={styles.title}>BodyVibe</Text>
                </View>

                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => latest && navigation.navigate('MeasurementDetails', { measurement: latest })}
                >
                    <GlassCard style={styles.mainCard}>
                        <View style={styles.row}>
                            <Weight color={Theme.colors.primary} size={32} />
                            <View style={styles.textStack}>
                                <Text style={styles.label}>Viimeisin paino</Text>
                                <Text style={styles.value}>
                                    {currentWeight ? `${currentWeight} kg` : '--'}
                                </Text>
                            </View>
                            {latest && (
                                <View style={{ marginLeft: 'auto' }}>
                                    <Text style={{ color: Theme.colors.primary, fontWeight: 'bold' }}>Avaa tiedot {'>'}</Text>
                                </View>
                            )}
                        </View>
                    </GlassCard>
                </TouchableOpacity>

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

                {chartData && chartData.datasets[0].data.length > 0 ? (
                    <View style={styles.chartSection}>
                        <Text style={styles.sectionTitle}>{chartData.title}</Text>
                        <View style={styles.chartTabs}>
                            <TouchableOpacity
                                style={[styles.tab, chartMetric === 'weight' && styles.activeTab]}
                                onPress={() => setChartMetric('weight')}
                            >
                                <Text style={[styles.tabText, chartMetric === 'weight' && styles.activeTabText]}>Paino</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tab, chartMetric === 'muscle' && styles.activeTab]}
                                onPress={() => setChartMetric('muscle')}
                            >
                                <Text style={[styles.tabText, chartMetric === 'muscle' && styles.activeTabText]}>Lihas</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tab, chartMetric === 'fat' && styles.activeTab]}
                                onPress={() => setChartMetric('fat')}
                            >
                                <Text style={[styles.tabText, chartMetric === 'fat' && styles.activeTabText]}>Rasva%</Text>
                            </TouchableOpacity>
                        </View>

                        <LineChart
                            data={{
                                labels: chartData.labels,
                                datasets: chartData.datasets
                            }}
                            width={screenWidth - 48} // padding
                            height={220}
                            yAxisSuffix={chartMetric === 'fat' ? '%' : ''}
                            chartConfig={{
                                backgroundColor: Theme.colors.background,
                                backgroundGradientFrom: '#1A1A1A',
                                backgroundGradientTo: '#000000',
                                decimalPlaces: 1,
                                color: (opacity = 1) => `rgba(0, 240, 255, ${opacity})`,
                                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                                style: {
                                    borderRadius: 16
                                },
                                propsForDots: {
                                    r: "6",
                                    strokeWidth: "2",
                                    stroke: Theme.colors.primary
                                }
                            }}
                            bezier
                            style={{
                                marginVertical: 8,
                                borderRadius: 16
                            }}
                        />
                    </View>
                ) : (
                    <View style={styles.emptyState}>
                        <TrendingUp color={Theme.colors.textDim} size={48} />
                        <Text style={styles.dimText}>
                            {measurements.length === 0 && weightEntries.length === 0
                                ? 'Ei vielä historiatietoja. Lisää ensimmäinen mittaus!'
                                : 'Lisää vähintään kaksi mittausta nähdäksesi kehityssuunnan.'}
                        </Text>
                    </View>
                )}

                <View style={{ height: 100 }} />
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
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: Theme.spacing.m,
    },
    chartSection: {
        marginTop: Theme.spacing.m,
        marginBottom: Theme.spacing.xl,
    },
    chartTabs: {
        flexDirection: 'row',
        marginBottom: Theme.spacing.m,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: Theme.colors.primary,
    },
    tabText: {
        color: Theme.colors.textDim,
        fontWeight: '600',
    },
    activeTabText: {
        color: Theme.colors.background,
    },
    dimText: {
        color: Theme.colors.textDim,
        fontSize: 16,
        textAlign: 'center',
        marginTop: Theme.spacing.m,
        maxWidth: '80%',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: Theme.spacing.xl,
        opacity: 0.5,
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
