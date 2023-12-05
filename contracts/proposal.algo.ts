import { Contract } from '@algorandfoundation/tealscript';

// Global variables to store project proposals and project contributions
const proposalProposals: [number, ProjectProposal][] = [];
const projectContributionsData: [Address, Contribution][] = [];

interface Contribution {
  contributor: Address; // Address of the contributor
  amount: number; // Amount contributed
}

interface ProjectProposal {
  id: Address; // Unique project proposal ID
  ownerAddress: Address; // Address of the project owner
  title: string; // Project title
  description: string; // Detailed project description
  fundingGoal: number; // Total funding goal for the project
  funding: number; // Amount of funding received for the project
  matchedFunds: number; // Amount of matched funds received through quadratic funding
}



class proposal extends Contract {

    proposer = GlobalStateKey<Address>();
    contributor = GlobalStateKey<Address>();
    fundingPeriodStart = GlobalStateKey<number>();
    proposal = GlobalStateKey<string>();
    endTime = GlobalStateKey<number>();
    contributionAmount = GlobalStateKey<number>();
    funding= GlobalStateKey<number>();
    matchedFunds= GlobalStateKey<number>();

    private projectContributionsData: [Address, Contribution][] = [];
    private proposalProposals: [Address, ProjectProposal][] = [];

    matchingPoolBalance: number = 0;

    createApplication(
        proposer: Address,
        contributor: Address,
        fundingPeriodStart: Number,
        proposal: String,
        endTime: number,
        contributionAmount: number,
        funding: number,
        matchedFunds: number
    ): void {
        this.proposer.value = proposer;
        this.contributor.value = contributor;
        this.fundingPeriodStart.value = fundingPeriodStart as number;
        this.proposal.value = proposal as string;
        this.endTime.value = endTime;
        this.contributionAmount.value = contributionAmount;
        this.funding.value = funding; 
        this.matchedFunds.value = matchedFunds;
    }

  //  fundingPeriodStart: number;
    //fundingPeriodEnd: number;
  /*  constructor() {
    super();

    this.fundingPeriodStart.value = globals.latestTimestamp;
    //this.fundingPeriodEnd = this.fundingPeriodStart + 3 * 30 * 24 * 60 * 60; // 3 months in seconds
    this.proposalProposals = []; // Initialize the proposalProposals array
    this.endTime.value =  3 * 30 * 24 * 60 * 60+ globals.latestTimestamp // in seconds
  }*/

  // Access and modify project proposals using the global array
  async submitProjectProposal(projectProposal: ProjectProposal) {
    const currentTime = globals.latestTimestamp;
    if (currentTime < this.fundingPeriodStart.value || currentTime > this.endTime.value) {
      throw new Error('Proposals can only be submitted during the active funding period');
    }
  
    // Initialize the projectContributionsData array if it hasn't been initialized already
    if (!this.projectContributionsData) {
      this.projectContributionsData = [];
    }
  
    // Add the project proposal to the global array
    const projectID = proposalProposals.length + 1;
    proposalProposals.push([projectID, projectProposal]);
  
    // Track contributions for the project
    const projectContributionsData = this.projectContributionsData
    .map((pair) => {
      const contribution: Contribution = {
        contributor: pair[0],
        amount: pair[1].amount,
      };
      return contribution;
    }) as Contribution[];
    const contribution: Contribution = {
      contributor: msg.sender,
      amount: projectProposal.funding,
    };
    projectContributionsData.push(contribution);

     // Calculate matched funds using the quadratic funding formula
     const totalContributions = projectContributionsData.reduce((sum, contribution) => sum + contribution.amount, 0);
     const matchedFunds = ((totalContributions + 1) ** (1 / 2) - 1) ** 2;
 
     // Update project proposal with matched funds
     projectProposal.matchedFunds = matchedFunds;
  
    // ...
  }

  
  

  // Access and modify project contributions using the global array
  async getProposalFundingData(proposalID: number): Promise<ProjectProposal> {
    // Find the project proposal with the given ID
    const projectProposalEntry = proposalProposals.find((pair) => pair[0] === proposalID);
    if (!projectProposalEntry) {
      throw new Error(`Proposal with ID ${proposalID} not found`);
    }
    const projectProposal: ProjectProposal = projectProposalEntry[1];

    // ...

    return projectProposal;
  }

  async addProjectContribution(proposalID: number, contribution: Contribution): Promise<void> {
    const existingContributions = this.getProjectContributions(proposalID);
    (await existingContributions).push(contribution);
}

async getProjectContributions(proposalID: number): Promise<Contribution[]> {
    const filteredContributions = projectContributionsData.filter((pair) => {
      if (typeof pair[0] === 'number') {
        return pair[0] === proposalID;
      } else {
        throw new Error('Invalid contribution data type');
      }
    });
  
    if (filteredContributions.length === 0) {
      return []; // No contributions found for the given proposal ID
    }
  
    return filteredContributions[0] as Contribution[]; // Return the first contribution
  }

  async fundMatchingPool(amount: number) {
    // Add the contribution to the matching pool balance (microAlgos)
    this.matchingPoolBalance += amount;
  }

  async getMatchingPoolBalance(): Promise<number> {
    return this.matchingPoolBalance;
  }

  async getFundingPeriodData(): Promise<{ start: number; end: number }> {
    return {
      start: this.fundingPeriodStart.value,
      end: this.endTime.value,
    };
  }

  async distributeMatchedFunds(send: (recipient: Address, amount: number) => void) {
    // Check if the current time is after the funding period end
    const currentTime = globals.latestTimestamp;
    if (currentTime <= this.endTime.value) {
      throw new Error('Matched funds can only be distributed after the funding period ends');
    }
  
    for (const pair of this.proposalProposals) {
        const projectID = pair[0]; // Extract the project ID from the pair
        if (projectID === projectID) {
          const projectProposal = pair[1];
          let projectContributions: Contribution[] = [];
          for (const pair of this.projectContributionsData) {
            if (pair[0] === projectID) {
              projectContributions.push(pair[1]);
            }
          }
    
  
        const totalContributions = projectContributions.reduce((sum, contribution) => sum + contribution.amount, 0);
        const matchedFunds = ((totalContributions + 1) ** (1 / 2) - 1) ** 2;
  
        // Transfer matched funds to project owner's address
        const projectOwnerAddress = projectProposal.ownerAddress;
        send(projectOwnerAddress, matchedFunds);
  
        // Update project proposal's matched funds
        projectProposal.matchedFunds = 0;
        this.proposalProposals.push([projectID, projectProposal]); // Update the element at the specified index
      }
      
    }
  
    // ...
    this.startNewFundingPeriod();

    
  }
  async startNewFundingPeriod() {
    // Reset funding period start and end timestamps
    this.fundingPeriodStart.value = globals.latestTimestamp;
    this.endTime.value = this.fundingPeriodStart.value + 3 * 30 * 24 * 60 * 60; // 3 months in seconds
  }
}