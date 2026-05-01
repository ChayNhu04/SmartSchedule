import React from 'react';
import { render, screen } from '@testing-library/react';
import { Calendar } from 'lucide-react';
import { EmptyState } from '../../../web/components/empty-state';

describe('EmptyState Component', () => {
  it('should render title', () => {
    render(<EmptyState icon={Calendar} title="No schedules" />);

    expect(screen.getByText('No schedules')).toBeInTheDocument();
  });

  it('should render description when provided', () => {
    render(
      <EmptyState
        icon={Calendar}
        title="No schedules"
        description="You don't have any schedules yet"
      />,
    );

    expect(screen.getByText("You don't have any schedules yet")).toBeInTheDocument();
  });

  it('should not render description when not provided', () => {
    const { container } = render(<EmptyState icon={Calendar} title="No schedules" />);

    const description = container.querySelector('p');
    expect(description).not.toBeInTheDocument();
  });

  it('should render action when provided', () => {
    render(
      <EmptyState
        icon={Calendar}
        title="No schedules"
        action={<button>Add Schedule</button>}
      />,
    );

    expect(screen.getByText('Add Schedule')).toBeInTheDocument();
  });

  it('should render icon', () => {
    const { container } = render(<EmptyState icon={Calendar} title="No schedules" />);

    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <EmptyState icon={Calendar} title="No schedules" className="custom-class" />,
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom-class');
  });

  it('should have correct structure', () => {
    const { container } = render(<EmptyState icon={Calendar} title="No schedules" />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center');
  });

  it('should render complete empty state with all props', () => {
    render(
      <EmptyState
        icon={Calendar}
        title="No schedules found"
        description="Try adjusting your filters"
        action={<button>Clear Filters</button>}
        className="my-custom-class"
      />,
    );

    expect(screen.getByText('No schedules found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your filters')).toBeInTheDocument();
    expect(screen.getByText('Clear Filters')).toBeInTheDocument();
  });
});
