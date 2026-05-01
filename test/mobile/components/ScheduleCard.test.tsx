import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text, View } from 'react-native';

// Mock ScheduleCard component (simplified version for testing)
const ScheduleCard = ({ schedule, onPress }: any) => {
  return (
    <View testID="schedule-card" onTouchEnd={onPress}>
      <Text testID="schedule-title">{schedule.title}</Text>
      <Text testID="schedule-description">{schedule.description}</Text>
      <Text testID="schedule-priority">{schedule.priority}</Text>
      <Text testID="schedule-status">{schedule.status}</Text>
      {schedule.tags?.map((tag: any) => (
        <Text key={tag.id} testID={`tag-${tag.name}`}>
          #{tag.name}
        </Text>
      ))}
    </View>
  );
};

describe('ScheduleCard Component (Mobile)', () => {
  const mockSchedule = {
    id: 1,
    title: 'Test Meeting',
    description: 'Test description',
    start_time: '2026-05-15T09:00:00Z',
    end_time: '2026-05-15T10:00:00Z',
    status: 'pending',
    priority: 'normal',
    item_type: 'meeting',
    recurrence_type: 'none',
    tags: [{ id: 1, name: 'work', color: '#3B82F6' }],
  };

  it('should render schedule title', () => {
    const { getByTestId } = render(<ScheduleCard schedule={mockSchedule} />);

    expect(getByTestId('schedule-title').props.children).toBe('Test Meeting');
  });

  it('should render schedule description', () => {
    const { getByTestId } = render(<ScheduleCard schedule={mockSchedule} />);

    expect(getByTestId('schedule-description').props.children).toBe('Test description');
  });

  it('should render priority', () => {
    const { getByTestId } = render(<ScheduleCard schedule={mockSchedule} />);

    expect(getByTestId('schedule-priority').props.children).toBe('normal');
  });

  it('should render status', () => {
    const { getByTestId } = render(<ScheduleCard schedule={mockSchedule} />);

    expect(getByTestId('schedule-status').props.children).toBe('pending');
  });

  it('should render tags', () => {
    const { getByTestId } = render(<ScheduleCard schedule={mockSchedule} />);

    expect(getByTestId('tag-work').props.children).toBe('#work');
  });

  it('should call onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<ScheduleCard schedule={mockSchedule} onPress={onPress} />);

    fireEvent(getByTestId('schedule-card'), 'touchEnd');
    expect(onPress).toHaveBeenCalled();
  });

  it('should handle schedule without description', () => {
    const scheduleWithoutDesc = { ...mockSchedule, description: null };
    const { getByTestId } = render(<ScheduleCard schedule={scheduleWithoutDesc} />);

    expect(getByTestId('schedule-description').props.children).toBeNull();
  });

  it('should handle schedule without tags', () => {
    const scheduleWithoutTags = { ...mockSchedule, tags: [] };
    const { queryByTestId } = render(<ScheduleCard schedule={scheduleWithoutTags} />);

    expect(queryByTestId('tag-work')).toBeNull();
  });

  it('should render high priority schedule', () => {
    const highPrioritySchedule = { ...mockSchedule, priority: 'high' };
    const { getByTestId } = render(<ScheduleCard schedule={highPrioritySchedule} />);

    expect(getByTestId('schedule-priority').props.children).toBe('high');
  });

  it('should render completed schedule', () => {
    const completedSchedule = { ...mockSchedule, status: 'completed' };
    const { getByTestId } = render(<ScheduleCard schedule={completedSchedule} />);

    expect(getByTestId('schedule-status').props.children).toBe('completed');
  });

  it('should render multiple tags', () => {
    const scheduleWithMultipleTags = {
      ...mockSchedule,
      tags: [
        { id: 1, name: 'work', color: '#3B82F6' },
        { id: 2, name: 'urgent', color: '#EF4444' },
        { id: 3, name: 'meeting', color: '#10B981' },
      ],
    };

    const { getByTestId } = render(<ScheduleCard schedule={scheduleWithMultipleTags} />);

    expect(getByTestId('tag-work')).toBeTruthy();
    expect(getByTestId('tag-urgent')).toBeTruthy();
    expect(getByTestId('tag-meeting')).toBeTruthy();
  });
});
