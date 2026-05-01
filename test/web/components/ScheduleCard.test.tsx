import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ScheduleCard } from '../../../web/components/schedule/schedule-card';
import { api } from '../../../web/lib/api';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('../../../web/lib/api');
jest.mock('sonner');

const mockSchedule = {
  id: 1,
  user_id: 'user-123',
  title: 'Test Meeting',
  description: 'Test description',
  start_time: new Date('2026-05-15T09:00:00Z').toISOString(),
  end_time: new Date('2026-05-15T10:00:00Z').toISOString(),
  status: 'pending' as const,
  priority: 'normal' as const,
  item_type: 'meeting' as const,
  recurrence_type: 'none' as const,
  recurrence_interval: 1,
  tags: [
    { id: 1, name: 'work', color: '#3B82F6', user_id: 'user-123', created_at: new Date() },
  ],
  remind_at: null,
  is_reminded: false,
  acknowledged_at: null,
  end_notified_at: null,
  recurrence_until: null,
  recurrence_parent_id: null,
  created_at: new Date(),
  updated_at: new Date(),
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('ScheduleCard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render schedule title', () => {
    render(<ScheduleCard schedule={mockSchedule} />, { wrapper: createWrapper() });

    expect(screen.getByText('Test Meeting')).toBeInTheDocument();
  });

  it('should render schedule description', () => {
    render(<ScheduleCard schedule={mockSchedule} />, { wrapper: createWrapper() });

    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('should render time range', () => {
    render(<ScheduleCard schedule={mockSchedule} />, { wrapper: createWrapper() });

    // Should show time in format HH:mm – HH:mm
    expect(screen.getByText(/09:00 – 10:00/)).toBeInTheDocument();
  });

  it('should render priority badge', () => {
    render(<ScheduleCard schedule={mockSchedule} />, { wrapper: createWrapper() });

    expect(screen.getByText('Vừa')).toBeInTheDocument(); // "normal" priority label
  });

  it('should render tags', () => {
    render(<ScheduleCard schedule={mockSchedule} />, { wrapper: createWrapper() });

    expect(screen.getByText('#work')).toBeInTheDocument();
  });

  it('should show complete button for pending schedules', () => {
    render(<ScheduleCard schedule={mockSchedule} />, { wrapper: createWrapper() });

    const completeButton = screen.getByTitle('Hoàn thành');
    expect(completeButton).toBeInTheDocument();
  });

  it('should not show complete button for completed schedules', () => {
    const completedSchedule = { ...mockSchedule, status: 'completed' as const };
    render(<ScheduleCard schedule={completedSchedule} />, { wrapper: createWrapper() });

    expect(screen.queryByTitle('Hoàn thành')).not.toBeInTheDocument();
  });

  it('should show edit button when onEdit provided', () => {
    const onEdit = jest.fn();
    render(<ScheduleCard schedule={mockSchedule} onEdit={onEdit} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByTitle('Sửa')).toBeInTheDocument();
  });

  it('should call onEdit when edit button clicked', () => {
    const onEdit = jest.fn();
    render(<ScheduleCard schedule={mockSchedule} onEdit={onEdit} />, {
      wrapper: createWrapper(),
    });

    fireEvent.click(screen.getByTitle('Sửa'));
    expect(onEdit).toHaveBeenCalledWith(mockSchedule);
  });

  it('should show delete button', () => {
    render(<ScheduleCard schedule={mockSchedule} />, { wrapper: createWrapper() });

    expect(screen.getByTitle('Xoá')).toBeInTheDocument();
  });

  it('should complete schedule when complete button clicked', async () => {
    (api.post as jest.Mock).mockResolvedValue({ data: { ...mockSchedule, status: 'completed' } });

    render(<ScheduleCard schedule={mockSchedule} />, { wrapper: createWrapper() });

    fireEvent.click(screen.getByTitle('Hoàn thành'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/schedules/1/complete');
      expect(toast.success).toHaveBeenCalledWith('Đã đánh dấu hoàn thành');
    });
  });

  it('should show error toast when complete fails', async () => {
    (api.post as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<ScheduleCard schedule={mockSchedule} />, { wrapper: createWrapper() });

    fireEvent.click(screen.getByTitle('Hoàn thành'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Không thể cập nhật');
    });
  });

  it('should delete schedule when delete button clicked and confirmed', async () => {
    (api.delete as jest.Mock).mockResolvedValue({ data: { ok: true } });
    window.confirm = jest.fn(() => true);

    render(<ScheduleCard schedule={mockSchedule} />, { wrapper: createWrapper() });

    fireEvent.click(screen.getByTitle('Xoá'));

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/schedules/1');
      expect(toast.success).toHaveBeenCalledWith('Đã xoá');
    });
  });

  it('should not delete when user cancels confirmation', async () => {
    window.confirm = jest.fn(() => false);

    render(<ScheduleCard schedule={mockSchedule} />, { wrapper: createWrapper() });

    fireEvent.click(screen.getByTitle('Xoá'));

    expect(api.delete).not.toHaveBeenCalled();
  });

  it('should show overdue badge for past pending schedules', () => {
    const overdueSchedule = {
      ...mockSchedule,
      start_time: new Date('2020-01-01T09:00:00Z').toISOString(),
    };

    render(<ScheduleCard schedule={overdueSchedule} />, { wrapper: createWrapper() });

    expect(screen.getByText('Quá hạn')).toBeInTheDocument();
  });

  it('should show completed badge for completed schedules', () => {
    const completedSchedule = { ...mockSchedule, status: 'completed' as const };

    render(<ScheduleCard schedule={completedSchedule} />, { wrapper: createWrapper() });

    expect(screen.getByText('Hoàn thành')).toBeInTheDocument();
  });

  it('should show cancelled badge for cancelled schedules', () => {
    const cancelledSchedule = { ...mockSchedule, status: 'cancelled' as const };

    render(<ScheduleCard schedule={cancelledSchedule} />, { wrapper: createWrapper() });

    expect(screen.getByText('Đã huỷ')).toBeInTheDocument();
  });

  it('should show recurrence badge for recurring schedules', () => {
    const recurringSchedule = { ...mockSchedule, recurrence_type: 'daily' as const };

    render(<ScheduleCard schedule={recurringSchedule} />, { wrapper: createWrapper() });

    expect(screen.getByText('Hằng ngày')).toBeInTheDocument();
  });

  it('should apply opacity for completed schedules', () => {
    const completedSchedule = { ...mockSchedule, status: 'completed' as const };

    const { container } = render(<ScheduleCard schedule={completedSchedule} />, {
      wrapper: createWrapper(),
    });

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('opacity-70');
  });

  it('should show priority bar with correct color', () => {
    const highPrioritySchedule = { ...mockSchedule, priority: 'high' as const };

    const { container } = render(<ScheduleCard schedule={highPrioritySchedule} />, {
      wrapper: createWrapper(),
    });

    const priorityBar = container.querySelector('.absolute.inset-y-0.left-0');
    expect(priorityBar).toBeInTheDocument();
  });

  it('should handle schedule without description', () => {
    const scheduleWithoutDesc = { ...mockSchedule, description: null };

    render(<ScheduleCard schedule={scheduleWithoutDesc} />, { wrapper: createWrapper() });

    expect(screen.queryByText('Test description')).not.toBeInTheDocument();
  });

  it('should handle schedule without end_time', () => {
    const scheduleWithoutEnd = { ...mockSchedule, end_time: null };

    render(<ScheduleCard schedule={scheduleWithoutEnd} />, { wrapper: createWrapper() });

    // Should only show start time
    expect(screen.getByText(/09:00/)).toBeInTheDocument();
    expect(screen.queryByText(/–/)).not.toBeInTheDocument();
  });

  it('should handle schedule without tags', () => {
    const scheduleWithoutTags = { ...mockSchedule, tags: [] };

    render(<ScheduleCard schedule={scheduleWithoutTags} />, { wrapper: createWrapper() });

    expect(screen.queryByText(/#/)).not.toBeInTheDocument();
  });

  it('should disable complete button while mutation is pending', async () => {
    (api.post as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000)),
    );

    render(<ScheduleCard schedule={mockSchedule} />, { wrapper: createWrapper() });

    const completeButton = screen.getByTitle('Hoàn thành');
    fireEvent.click(completeButton);

    await waitFor(() => {
      expect(completeButton).toBeDisabled();
    });
  });

  it('should disable delete button while mutation is pending', async () => {
    (api.delete as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000)),
    );
    window.confirm = jest.fn(() => true);

    render(<ScheduleCard schedule={mockSchedule} />, { wrapper: createWrapper() });

    const deleteButton = screen.getByTitle('Xoá');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(deleteButton).toBeDisabled();
    });
  });
});
