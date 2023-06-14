describe('Sign Up', () => {
  it('successfully signs up a new user', () => {
    cy.visit('localhost:4000')
    cy.get('.btn-secondary').contains('Sign Up').click()
    cy.wait(500)
    cy.get('#signUpEmail').type('helena.segedin@gmail.com')
    cy.get('#signUpPassword').type('testpassword')
    cy.get('.modal-footer button').contains('Sign Up').click()
    cy.wait(1000)
    cy.on('window:alert', (text) => {
      expect(text).to.contains('User created successfully')
    })
  })

  it('displays an error message for missing email', () => {
    cy.visit('localhost:4000')
    cy.get('.btn-secondary').contains('Sign Up').click()
    cy.wait(500)
    cy.get('#signUpPassword').type('testpassword')
    cy.get('.modal-footer button').contains('Sign Up').click()
    cy.on('window:alert', (text) => {
      expect(text).to.contains('Email and password are required')
    })
  })

  it('displays an error message for missing password', () => {
    cy.visit('localhost:4000')
    cy.get('.btn-secondary').contains('Sign Up').click()
    cy.wait(500)
    cy.get('#signUpEmail').type('helena.segedin@gmail.com')
    cy.get('.modal-footer button').contains('Sign Up').click()
    cy.on('window:alert', (text) => {
      expect(text).to.contains('Email and password are required')
    })
  })

  it('displays an error message for invalid email', () => {
  cy.visit('localhost:4000')
  cy.get('.btn-secondary').contains('Sign Up').click()
  cy.wait(500)
  cy.get('#signUpEmail').type('invalidemail')
  cy.get('#signUpPassword').type('testpassword')
  cy.get('.modal-footer button').contains('Sign Up').click()
  cy.on('window:alert', (text) => {
    expect(text).to.contains('Email must be in a valid format')
    })
  })

  it('displays an error message for invalid password', () => {
    cy.visit('localhost:4000')
    cy.get('.btn-secondary').contains('Sign Up').click()
    cy.wait(500)
    cy.get('#signUpEmail').type('helena.segedin@gmail.com')
    cy.get('#signUpPassword').type('short')
    cy.get('.modal-footer button').contains('Sign Up').click()
    cy.on('window:alert', (text) => {
      expect(text).to.contains('Password must be at least 8 characters long')
    })
  })
})
