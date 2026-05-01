import React from 'react';
import { render, screen } from '@testing-library/react';
import { PriorityBadge } from '../../../web/components/schedule/priority-badge';

describe('PriorityBadge Component', () => {
  it('should render low priority badge', () => {
    render(<PriorityBadge priority="low" />);

    expect(screen.getByText('Thấp')).toBeInTheDocument();
  });

  it('should render normal priority badge', () => {
    render(<PriorityBadge priority="normal" />);

    expect(screen.getByText('Vừa')).toBeInTheDocument();
  });

  it('should render high priority badge', () => {
    render(<PriorityBadge priority="high" />);

    expect(screen.getByText('Cao')).toBeInTheDocument();
  });

  it('should render priority dot', () => {
    const { container } = render(<PriorityBadge priority="high" />);

    const dot = container.querySelector('.h-1\\.5.w-1\\.5.rounded-full');
    expect(dot).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(<PriorityBadge priority="normal" className="custom-class" />);

    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveClass('custom-class');
  });

  it('should have correct structure', () => {
    const { container } = render(<PriorityBadge priority="high" />);

    const badge = container.firstChild as HTMLElement;
    expect(badge.tagName).toBe('SPAN');
    expect(badge).toHaveClass('inline-flex', 'items-center', 'gap-1.5');
  });

  it('should render all priority levels correctly', () => {
    const priorities: Array<'low' | 'normal' | 'high'> = ['low', 'normal', 'high'];
    const labels = ['Thấp', 'Vừa', 'Cao'];

    priorities.forEach((priority, index) => {
      const { unmount } = render(<PriorityBadge priority={priority} />);
      expect(screen.getByText(labels[index])).toBeInTheDocument();
      unmount();
    });
  });
});
