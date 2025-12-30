// Mock JWT config
const mockGenerateToken = jest.fn(() => 'mock-access-token');
const mockGenerateRefreshToken = jest.fn(() => 'mock-refresh-token');
const mockVerifyToken = jest.fn(() => ({ id: 'test-user-id', role: 'waitstaff' }));
const mockVerifyRefreshToken = jest.fn(() => ({ id: 'test-user-id', role: 'waitstaff' }));

module.exports = {
  generateToken: mockGenerateToken,
  generateRefreshToken: mockGenerateRefreshToken,
  verifyToken: mockVerifyToken,
  verifyRefreshToken: mockVerifyRefreshToken,
};
