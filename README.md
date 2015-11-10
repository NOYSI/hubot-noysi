# hubot-noysi
hubot-noysi is the <a href="https://github.com/github/hubot">HUBOT</a> adapter to use in <a href="https://noysi.com">NOYSI</a>

## Getting Started
### Getting a TOKEN from Noysi
In order to use your own **HUBOT** you first need to get a new token, so the robot can connect to NOYSI's infrastructure.    
  1. Log in Noysi with your account.  
  2. Click on the down-arrow displayed next to your profile name, on the left-upper corner.  
  3. Click in *integrations*.  
  4. Look for **HUBOT** under the *all services* tab and press *see*.  
  5. Set a name to your new robot and press *Add Hubot*.   
  6. The new token for your newly created HUBOT is available in the first text-box, named *API Token*.  
  7. Click in the button *Save integration*. Your new HUBOT is now created and available.
  
### Installing HUBOT  
HUBOT needs yeoman to generate the HUBOT code. These steps will install HUBOT, yeoman, the generator-hubot, the coffee-script package and hubot-conversation.  
  1. ```npm install -g hubot coffee-script yo generator-hubot```
  2. ```mkdir /path/to/hubot```
  3. ```cd /path/to/hubot```
  4. ```yo hubot```
  5. ```npm install hubot-noysi hubot-conversation --save```  
  6. ```bin/hubot -a noysi
  
#CONTINUES
