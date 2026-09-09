describe('Customer Prescription Upload Flow', () => {
  beforeEach(() => {
    cy.visit('/login');
    // Login as a customer
    cy.get('input[placeholder="Email address"]').type('customer@example.com');
    cy.get('input[placeholder="Password"]').type('password');
    cy.contains('button', 'Sign in').click();
    
    cy.url().should('include', '/customer');
  });

  it('allows a customer to upload a prescription', () => {
    // Navigate to Prescriptions tab
    cy.contains('button', 'Prescriptions').click();
    
    // Click Upload New Prescription
    cy.contains('button', 'Upload New Prescription').click();
    
    // Fill out the form
    cy.get('textarea[name="notes"]').type('Please process this prescription quickly.');
    
    // Upload file
    // Note: Cypress requires special handling for file uploads using selectFile
    cy.get('input[type="file"]').selectFile({
      contents: Cypress.Buffer.from('dummy file content'),
      fileName: 'prescription.jpg',
      mimeType: 'image/jpeg',
    });
    
    // Submit
    cy.contains('button', 'Submit Prescription').click();
    
    // Verify success
    cy.contains('Prescription uploaded successfully').should('be.visible');
  });
});
