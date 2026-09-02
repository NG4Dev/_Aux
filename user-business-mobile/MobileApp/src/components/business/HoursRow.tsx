import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { BusinessHours, DayOfWeek } from '@/types/business';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

const formatTime = (hhmm: string) => hhmm;

type Status =
  | { kind: 'open'; closesAt: string }
  | { kind: 'closed'; nextOpen?: { day: string; time: string } };

const computeStatus = (hours: BusinessHours[]): Status => {
  if (hours.length === 0) return { kind: 'closed' };
  const now = new Date();
  const today = now.getDay() as DayOfWeek;
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const todayEntry = hours.find((h) => h.day === today);
  if (todayEntry) {
    const openMin = toMinutes(todayEntry.open);
    const closeMin = toMinutes(todayEntry.close);
    if (nowMin >= openMin && nowMin < closeMin) {
      return { kind: 'open', closesAt: todayEntry.close };
    }
  }

  for (let i = 1; i <= 7; i += 1) {
    const checkDay = ((today + i) % 7) as DayOfWeek;
    const entry = hours.find((h) => h.day === checkDay);
    if (entry) {
      return {
        kind: 'closed',
        nextOpen: { day: DAY_NAMES[checkDay], time: entry.open },
      };
    }
  }

  return { kind: 'closed' };
};

type Props = {
  hours: BusinessHours[];
};

export default function HoursRow({ hours }: Props) {
  const [expanded, setExpanded] = useState(false);
  const status = useMemo(() => computeStatus(hours), [hours]);

  const summary =
    status.kind === 'open'
      ? `Open until ${formatTime(status.closesAt)}`
      : status.nextOpen
        ? `Closed today (Opens ${status.nextOpen.day} at ${formatTime(status.nextOpen.time)})`
        : 'Closed';

  return (
    <View>
      <TouchableOpacity
        style={styles.row}
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.7}
      >
        <Ionicons
          name="time-outline"
          size={16}
          color="rgba(255,255,255,0.7)"
        />
        <Text style={styles.text}>{summary}</Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={14}
          color="rgba(255,255,255,0.45)"
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.weekList}>
          {DAY_NAMES.map((label, i) => {
            const entry = hours.find((h) => h.day === (i as DayOfWeek));
            return (
              <View key={label} style={styles.weekRow}>
                <Text style={styles.dayLabel}>{label}</Text>
                <Text style={styles.dayValue}>
                  {entry ? `${entry.open} - ${entry.close}` : 'Closed'}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    flex: 1,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
  },
  weekList: {
    marginTop: 8,
    paddingLeft: 24,
    gap: 4,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    fontWeight: '600',
  },
  dayValue: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
  },
});
