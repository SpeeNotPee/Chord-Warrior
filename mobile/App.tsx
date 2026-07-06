import { useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { harmonicEngine, PROGRESSION_LIBRARY } from '@chordwarrior/harmonic-engine';
import type { KeyCenter } from '@chordwarrior/harmonic-engine';

const KEY: KeyCenter = { root: 0, scaleType: 'major' };

/**
 * Mobile scaffold: proves out the shared @chordwarrior/harmonic-engine package
 * on React Native. Sheet-music rendering, MIDI input, and microphone pitch
 * detection are desktop/web-only in this pass (Web MIDI + raw mic FFT access
 * aren't available in Expo's managed workflow without native modules), so
 * this screen exercises the progression-generation half of the app only.
 */
export default function App() {
  const [progressionId, setProgressionId] = useState(PROGRESSION_LIBRARY[0].id);

  const chords = useMemo(() => harmonicEngine.generateFromLibrary(progressionId, KEY), [progressionId]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.title}>ChordWarrior</Text>
      <Text style={styles.subtitle}>Mobile scaffold — harmonic engine preview</Text>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {PROGRESSION_LIBRARY.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={[styles.progressionButton, p.id === progressionId && styles.progressionButtonActive]}
            onPress={() => setProgressionId(p.id)}
          >
            <Text style={styles.progressionButtonText}>{p.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.chordRow}>
        {chords.map((c, i) => (
          <View key={i} style={styles.chordChip}>
            <Text style={styles.chordSymbol}>{c.symbol}</Text>
            <Text style={styles.chordRoman}>{c.romanNumeral}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.note}>
        Sight-reading (VexFlow), MIDI input, and microphone pitch detection are not yet available on
        mobile in this build — see the web/desktop app for the full experience.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#16181d', padding: 20 },
  title: { color: '#e8e9ec', fontSize: 28, fontWeight: '700' },
  subtitle: { color: '#9099a8', fontSize: 14, marginTop: 4, marginBottom: 20 },
  list: { maxHeight: 220 },
  listContent: { gap: 8 },
  progressionButton: {
    borderWidth: 1,
    borderColor: '#2e323b',
    borderRadius: 8,
    padding: 12,
  },
  progressionButtonActive: { borderColor: '#5b8cff' },
  progressionButtonText: { color: '#e8e9ec' },
  chordRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 24 },
  chordChip: {
    backgroundColor: '#1e2128',
    borderWidth: 1,
    borderColor: '#2e323b',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    minWidth: 70,
  },
  chordSymbol: { color: '#e8e9ec', fontSize: 20, fontWeight: '700' },
  chordRoman: { color: '#9099a8', fontSize: 12, marginTop: 2 },
  note: { color: '#9099a8', fontSize: 12, marginTop: 32 },
});
