import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { Theme } from '../theme/theme';

interface GlassCardProps {
    children: React.ReactNode;
    style?: ViewStyle;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, style }) => {
    return (
        <View style={[styles.container, style]}>
            <BlurView intensity={20} tint="dark" style={styles.blur}>
                {children}
            </BlurView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: Theme.roundness,
        overflow: 'hidden',
        backgroundColor: Theme.colors.card,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    blur: {
        padding: Theme.spacing.l,
    },
});
