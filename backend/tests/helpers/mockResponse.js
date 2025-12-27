function createMockResponse() {
  const response = {}
  response.status = jest.fn().mockReturnValue(response)
  response.json = jest.fn().mockReturnValue(response)
  response.send = jest.fn().mockReturnValue(response)
  return response
}

module.exports = { createMockResponse }
