# Dev Framework Setup Guide

## Welcome!

This guide will walk you through setting up the Dev Framework on your Windows computer. Follow each step carefully, and **don't skip any steps!**

**Time needed:** About 45-60 minutes (first time setup takes a while, but you only do it once!)

**What you'll have when done:** A powerful coding assistant that helps you build websites and applications.

---

## Table of Contents

1. [Before You Start](#part-1-before-you-start)
2. [Install WSL (Windows Subsystem for Linux)](#part-2-install-wsl)
3. [Set Up Your WSL Environment](#part-3-set-up-your-wsl-environment)
4. [Set Up GitHub](#part-4-set-up-github)
5. [Download the Framework](#part-5-download-the-framework)
6. [Install Claude Code](#part-6-install-claude-code)
7. [Test That Everything Works](#part-7-test-that-everything-works)
8. [Create Your First Project](#part-8-create-your-first-project)
9. [How to Get Updates from Dad](#part-9-how-to-get-framework-updates-from-dad)
10. [Troubleshooting](#part-10-troubleshooting)

---

## Part 1: Before You Start

Make sure you have:

- [ ] A Windows computer (Windows 10 or Windows 11)
- [ ] Internet connection
- [ ] An email address
- [ ] About 45-60 minutes of uninterrupted time
- [ ] Your computer plugged in (installations use battery)

---

## Part 2: Install WSL

**What is WSL?** WSL stands for "Windows Subsystem for Linux." It lets you run Linux (a different operating system) inside Windows. This is the best way to do coding on Windows because many coding tools work better in Linux.

### Step 2.1: Open PowerShell as Administrator

1. Click the **Start button** (the Windows logo in the bottom-left corner of your screen)
2. Type: `PowerShell`
3. You'll see "Windows PowerShell" appear in the search results
4. **Important:** Right-click on "Windows PowerShell"
5. Click **"Run as administrator"**
6. A window will pop up asking "Do you want to allow this app to make changes?" - Click **Yes**

You should now see a blue window with white text. This is PowerShell - it's a way to type commands to your computer.

### Step 2.2: Install WSL

In the blue PowerShell window, carefully type this command exactly as shown:

```
wsl --install
```

Then press the **Enter** key on your keyboard.

**What you'll see:**
- Text will start appearing showing the installation progress
- This can take 5-10 minutes
- Let it run until you see a message saying installation is complete

### Step 2.3: Restart Your Computer

**Important:** You MUST restart your computer for WSL to finish installing.

1. Save any work you have open
2. Click Start → Power → Restart

### Step 2.4: Complete Ubuntu Setup

After your computer restarts:

1. A black window might open automatically titled "Ubuntu"
   - If it doesn't, click Start, type `Ubuntu`, and click on the Ubuntu app
2. Wait - it will say "Installing, this may take a few minutes..."
3. When it asks **"Enter new UNIX username:"**
   - Type a simple username (lowercase, no spaces) like: `yourfirstname`
   - Press Enter
4. When it asks **"New password:"**
   - Type a password (you won't see it as you type - this is normal!)
   - Press Enter
5. When it asks **"Retype new password:"**
   - Type the same password again
   - Press Enter

**Write down this username and password!** You'll need them later.

You should now see something like:
```
yourname@COMPUTER-NAME:~$
```

This means Ubuntu is ready! This black window is called a **"terminal"** - it's where you'll type commands.

**Keep this window open for the next steps.**

---

## Part 3: Set Up Your WSL Environment

Now we need to install some tools inside your new Linux environment.

### Step 3.1: Open the Terminal (If It's Not Already Open)

If you closed the black Ubuntu window:

1. Click the **Start button**
2. Type: `Ubuntu`
3. Click on the **Ubuntu** app (it has an orange circle logo)

You should see the black window with text ending in `$`

### Step 3.2: Update Linux

Copy this command, paste it into the black window, and press Enter:

**How to paste in the terminal:** Right-click inside the black window (this pastes automatically)

```
sudo apt update && sudo apt upgrade -y
```

- It will ask for your password - type the password you created earlier and press Enter
- **Note:** You won't see the password as you type - just type it and press Enter
- This will take a few minutes. Wait until you see the `$` prompt again.

### Step 3.3: Install Node.js

Node.js is a tool that lets you run JavaScript code. Copy and paste these commands one at a time, pressing Enter after each:

**Command 1:**
```
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
```

Wait for it to finish (you'll see the `$` prompt again), then:

**Command 2:**
```
sudo apt install -y nodejs
```

Wait for it to finish.

### Step 3.4: Verify Node.js Installed

Type this and press Enter:

```
node --version
```

You should see something like: `v20.10.0`

Type this and press Enter:

```
npm --version
```

You should see something like: `10.2.0`

**If you see version numbers, Node.js is installed! Move to the next step.**

### Step 3.5: Install Git

Git is already installed in Ubuntu, but let's make sure it's up to date:

```
sudo apt install -y git
```

Verify it works:

```
git --version
```

You should see something like: `git version 2.34.1`

---

## Part 4: Set Up GitHub

GitHub is a website where all your code will be stored online. This lets Dad see your code and help you when you need it.

### Step 4.1: Create a GitHub Account

**Skip this if you already have a GitHub account.**

1. Open your web browser (Chrome, Edge, Firefox, etc.)
2. Go to: **https://github.com**
3. Click the **"Sign up"** button
4. Enter your email address
5. Create a password
6. Choose a username (this will be public, so pick something appropriate)
7. Complete the puzzle/verification
8. Check your email and click the verification link GitHub sends you

**Write down your GitHub username and password!**

### Step 4.2: Tell Git Who You Are

Go back to your Ubuntu terminal (the black window). If you closed it, open it again by clicking Start → Ubuntu.

Run these two commands. **Replace the parts in quotes with YOUR information:**

```
git config --global user.name "Your Name"
```

Press Enter. Then:

```
git config --global user.email "your.email@example.com"
```

Press Enter.

**Important:** Use the same email you used to create your GitHub account!

---

## Part 5: Download the Framework

Now you'll download the Dev Framework to your computer.

### Step 5.1: Create a Folder for Your Code

In your Ubuntu terminal, type these commands one at a time:

```
mkdir -p ~/Code
```

Press Enter. Then:

```
cd ~/Code
```

Press Enter.

**What this does:**
- `mkdir -p ~/Code` creates a new folder called "Code" in your home directory
- `cd ~/Code` moves you into that folder

### Step 5.2: Download the Framework

Copy and paste this command:

```
git clone https://github.com/Sean-t3422/dev-framework-template.git my-dev-framework
```

Press Enter.

You should see:
```
Cloning into 'my-dev-framework'...
remote: Enumerating objects: ...
...
```

Wait until it finishes and you see the `$` prompt again.

### Step 5.3: Go Into the Framework Folder

```
cd my-dev-framework
```

Press Enter.

Your prompt should now look something like:
```
yourname@COMPUTER:~/Code/my-dev-framework$
```

### Step 5.4: Set Up Updates from Dad

This lets you receive framework updates when Dad improves things:

```
git remote add upstream https://github.com/Sean-t3422/dev-framework-template.git
```

Press Enter.

#### Verify It Worked:

```
git remote -v
```

You should see four lines mentioning both "origin" and "upstream". If you see both, you're good!

---

## Part 6: Install Claude Code

Claude Code is the AI assistant that powers the framework.

### Step 6.1: Install Claude Code

Make sure you're still in the Ubuntu terminal. Run this command:

```
npm install -g @anthropic-ai/claude-code
```

Press Enter.

You'll see a lot of text scroll by. Wait until it finishes (you'll see the `$` prompt again). This might take 2-3 minutes.

### Step 6.2: Verify Installation

```
claude --version
```

You should see a version number like `1.0.0` or similar.

### Step 6.3: Log Into Claude

Make sure you're in the framework folder:

```
cd ~/Code/my-dev-framework
```

Then start Claude:

```
claude
```

**The first time you run this:**

1. A message will appear with a URL
2. Hold **Ctrl** and click the URL (or copy it and paste into your browser)
3. This opens a webpage asking you to log in
4. If you don't have an Anthropic account, create one at https://console.anthropic.com/
5. Follow the prompts to authorize Claude Code
6. Go back to your terminal - Claude should now be running

**You should see a Claude prompt** - something like:
```
claude>
```

Or a welcome message from Claude.

### Step 6.4: Exit Claude (For Now)

Type this and press Enter:

```
/exit
```

This closes Claude. We'll come back to it soon!

---

## Part 7: Test That Everything Works

Let's make sure everything is set up correctly!

### Step 7.1: Open Ubuntu Terminal

1. Click the **Start button**
2. Type: `Ubuntu`
3. Click the **Ubuntu** app

### Step 7.2: Go to the Framework Folder

```
cd ~/Code/my-dev-framework
```

Press Enter.

### Step 7.3: Start Claude

```
claude
```

Press Enter.

### Step 7.4: Test the Framework

Once Claude starts, type:

```
/check-project
```

Press Enter.

If you see information about the project structure (mentioning things like ".claude", "agents", "projects"), **everything is working!**

### Step 7.5: Exit Claude

```
/exit
```

---

## Part 8: Create Your First Project

Now let's create your first project!

### Step 8.1: Open Ubuntu Terminal

(If not already open)

1. Click Start
2. Type: `Ubuntu`
3. Click the Ubuntu app

### Step 8.2: Go to the Framework Folder

```
cd ~/Code/my-dev-framework
```

### Step 8.3: Create a Project Folder

```
mkdir -p projects/my-first-project
```

This creates a folder for your first project.

### Step 8.4: Set Up Your Project

```
cd projects/my-first-project
npm init -y
```

This creates a basic project configuration file.

### Step 8.5: Go Back and Start Claude

```
cd ~/Code/my-dev-framework
claude
```

### Step 8.6: Start Building!

Now you can tell Claude what you want to build! Try saying something like:

> I want to build a simple todo list website

Claude will guide you through the process!

---

## Part 9: How to Get Framework Updates from Dad

When Dad improves the framework, he'll let you know. Here's how to get the updates:

### Step 9.1: Open Ubuntu Terminal

1. Click Start
2. Type: `Ubuntu`
3. Click the Ubuntu app

### Step 9.2: Go to the Framework Folder

```
cd ~/Code/my-dev-framework
```

### Step 9.3: Get the Updates

Run these two commands:

```
git fetch upstream
```

Press Enter. Then:

```
git merge upstream/main
```

Press Enter.

**If a text editor opens** asking for a merge message:
- Press `Ctrl + X` to exit
- If it asks to save, press `Y` then Enter

### Step 9.4: Done!

You now have the latest framework updates.

---

## Part 10: Troubleshooting

### "Ubuntu is not recognized" or can't find Ubuntu

WSL might not have installed correctly. Open PowerShell as Administrator and run:
```
wsl --install -d Ubuntu
```
Then restart your computer.

### "command not found: node"

Node.js isn't installed. Go back to Part 3, Step 3.3 and follow the Node.js installation steps.

### "command not found: claude"

Claude Code isn't installed. Run:
```
npm install -g @anthropic-ai/claude-code
```

### "Permission denied" errors

Try adding `sudo` before the command:
```
sudo npm install -g @anthropic-ai/claude-code
```
Enter your Linux password when asked.

### Can't paste into the terminal

In the Ubuntu terminal, **right-click** to paste. Ctrl+V doesn't work in the terminal by default.

### "git clone" isn't working / network errors

Make sure you have internet connection. Also, sometimes you need to wait a few seconds and try again.

### "merge conflict" when getting updates

Don't panic! Run:
```
git merge --abort
```
Then ask Dad for help.

### Claude isn't recognizing the framework

Make sure you're in the `my-dev-framework` folder when you start Claude:
```
cd ~/Code/my-dev-framework
claude
```

### The terminal closed and I don't know where I am

Just start fresh:
1. Open Ubuntu from the Start menu
2. Run: `cd ~/Code/my-dev-framework`
3. Now you're in the right place!

### Password not working in terminal

Remember: when you type passwords in the terminal, **nothing shows up** - no dots, no asterisks, nothing. This is normal. Just type your password and press Enter.

### Need More Help?

Text or call Dad! He can see your code on GitHub and help you figure out what's wrong.

---

## Quick Reference Card

**Save this for easy reference!**

| What You Want to Do | What to Type |
|---------------------|--------------|
| Open the terminal | Start → type "Ubuntu" → click Ubuntu |
| Go to framework folder | `cd ~/Code/my-dev-framework` |
| Start Claude | `claude` |
| Exit Claude | `/exit` |
| Get updates from Dad | `git fetch upstream` then `git merge upstream/main` |
| Create a new project | `mkdir -p projects/project-name` |
| Check if framework works | `/check-project` (inside Claude) |

---

## Important Rules

1. **Never change files in the `.claude/` folder** - This is the framework's brain
2. **Never change files in the `agents/` folder** - These are the framework's helpers
3. **Always put your projects in the `projects/` folder** - This is YOUR space
4. **Always start Claude from the `my-dev-framework` folder** - Otherwise it won't work right

---

## How to Open the Terminal - Quick Reminder

Since you'll be doing this a lot, here's a quick reminder:

1. Click the **Windows Start button** (bottom-left of screen)
2. Type: **Ubuntu**
3. Click the orange **Ubuntu** app
4. The black window that opens is your terminal!

---

## You're Ready!

Congratulations! You now have a professional coding environment set up. The framework will help you:

- Write better code
- Follow good practices
- Build real websites and applications

Have fun coding! And remember, Dad can always help if you get stuck.

---

*Guide created by Dad. Last updated: November 2024.*
