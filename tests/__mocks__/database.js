// Mock database module
const mockQuery = jest.fn();
const mockPool = {
  query: mockQuery,
  connect: jest.fn(),
};

const mockDb = {
  query: mockQuery,
  pool: mockPool,
};

module.exports = mockDb;
