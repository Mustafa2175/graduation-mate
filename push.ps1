# Stage all modified and new files
Write-Host "Staging changes..." -ForegroundColor Cyan
git add .

# Commit changes
Write-Host "Committing changes..." -ForegroundColor Cyan
git commit -m "feat: complete Developer 3 styling, filters, commitment selector, and accessibility refinements"

# Push to the remote branch
Write-Host "Pushing changes to remote branch..." -ForegroundColor Cyan
git push

Write-Host "Successfully pushed to branch!" -ForegroundColor Green
