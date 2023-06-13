describe('Sign up and sign in', () => {
  it('successfully signs up a new user', () => {
    cy.visit('localhost:4000')
    cy.get('.btn-secondary').contains('Sign Up').click()
    cy.wait(500)
    cy.get('#signUpEmail').type('helena.segedin@gmail.com')
    cy.get('#signUpPassword').type('testpassword')
    cy.get('.modal-footer button').contains('Sign Up').click()
    cy.wait(1000)
    cy.on('window:alert', (text) => {
      expect(text).to.contain('User created successfully')
    })
  })

  it('successfully signs in a new user', () => {
    cy.visit('localhost:4000')
    cy.get('button').contains('Sign In').click()
    cy.wait(500)
    cy.get('#signInEmail').type('helena.segedin@gmail.com')
    cy.get('#signInPassword').type('testpassword')
    cy.get('.modal-footer button').contains('Sign in').click()
    cy.wait(500)
    cy.get('button').should('contain', 'Sign Out')
    cy.get('button').should('contain', 'Add Plant')
  })
})
