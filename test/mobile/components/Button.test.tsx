import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text, TouchableOpacity } from 'react-native';

// Mock Button component
const Button = ({ onPress, children, disabled, testID }: any) => {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} testID={testID}>
      <Text>{children}</Text>
    </TouchableOpacity>
  );
};

describe('Button Component (Mobile)', () => {
  it('should render button text', () => {
    const { getByText } = render(<Button>Click Me</Button>);

    expect(getByText('Click Me')).toBeTruthy();
  });

  it('should call onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <Button onPress={onPress} testID="test-button">
        Press
      </Button>,
    );

    fireEvent.press(getByTestId('test-button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('should not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <Button onPress={onPress} disabled testID="test-button">
        Press
      </Button>,
    );

    fireEvent.press(getByTestId('test-button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('should render children', () => {
    const { getByText } = render(
      <Button>
        <Text>Custom Content</Text>
      </Button>,
    );

    expect(getByText('Custom Content')).toBeTruthy();
  });

  it('should handle multiple presses', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <Button onPress={onPress} testID="test-button">
        Press
      </Button>,
    );

    const button = getByTestId('test-button');
    fireEvent.press(button);
    fireEvent.press(button);
    fireEvent.press(button);

    expect(onPress).toHaveBeenCalledTimes(3);
  });
});
