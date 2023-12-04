declare global {
  const msg: { sender: Address };
}

import { Contract } from '@algorandfoundation/tealscript';
import { ProjectProposal } from './types/ProjectProposal';

class proposal extends Contract {
  projectProposals: Map<number, ProjectProposal> = new Map();

  async submitProjectProposal(projectProposal: ProjectProposal) {
    
  
    // Create an instance of the proposal class
    const proposalContract = new proposal();
  
    // Call the accountBalance method on the instance
  
  
    const projectProposalID = this.projectProposals.size + 1;
    this.projectProposals.set(projectProposalID, projectProposal);
  }

}

  
