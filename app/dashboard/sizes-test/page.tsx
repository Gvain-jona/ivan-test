'use client'

import React, { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SmartCombobox } from '@/components/ui/smart-combobox'
import { useSmartSizes } from '@/hooks/useSmartSizes'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import { DatabaseSetupMessage } from '@/components/ui/database-setup-message'
import { createClient } from '@/lib/supabase/client'

export default function SizesTestPage() {
  const [selectedSize, setSelectedSize] = useState('')
  const [tablesExist, setTablesExist] = useState<boolean | null>(null)
  const [hasData, setHasData] = useState<boolean | null>(null)

  // Check if the required tables exist
  useEffect(() => {
    const checkTables = async () => {
      const supabase = createClient()

      try {
        // Try to fetch one row from the sizes table
        const sizesResult = await supabase.from('sizes').select('id').limit(1)

        // If the table doesn't exist, show the setup message
        if (sizesResult.error) {
          console.warn('Sizes table does not exist:', sizesResult.error)
          setTablesExist(false)
          setHasData(false)
        } else {
          setTablesExist(true)
          
          // Check if there's any data in the table
          const sizesData = await supabase.from('sizes').select('id').limit(1)
          
          const hasAnyData = sizesData.data && sizesData.data.length > 0
          
          setHasData(hasAnyData)
        }
      } catch (error) {
        console.error('Error checking tables:', error)
        setTablesExist(false)
      }
    }

    checkTables()
  }, [])

  // Use our smart sizes hook
  const {
    sizes: sizeOptions,
    recentSizes,
    isLoading: sizesLoading,
    createSize,
    refreshSizes
  } = useSmartSizes()

  // Handle creating a new size
  const handleCreateSize = async (value: string) => {
    const newSize = await createSize(value)
    if (newSize) {
      setSelectedSize(newSize.value)
      toast({
        title: 'Size created',
        description: `${newSize.label} has been created successfully.`,
      })
      return newSize
    }
    return null
  }
  
  // Handle refreshing all options
  const handleRefresh = () => {
    refreshSizes()
    toast({
      title: 'Data refreshed',
      description: 'Size options have been refreshed.',
    })
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Sizes Database Test</h1>

        {tablesExist === false ? (
          <div className="my-8">
            <DatabaseSetupMessage 
              title="Database Tables Required"
              description="The sizes table needs to be set up in your database."
            />
          </div>
        ) : tablesExist === true && hasData === false ? (
          <div className="my-8">
            <DatabaseSetupMessage 
              title="Sample Data Required"
              description="The sizes table exists, but there's no data in it. Add some sample data to test the sizes dropdown."
              showMigrationInstructions={false}
            />
          </div>
        ) : tablesExist === null ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Size Selection</CardTitle>
                <CardDescription>
                  Select an existing size or create a new one
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <SmartCombobox
                  options={sizeOptions}
                  value={selectedSize}
                  onChange={setSelectedSize}
                  placeholder="Select or create a size"
                  allowCreate={true}
                  onCreateOption={handleCreateSize}
                  entityName="Size"
                  emptyMessage="No sizes found. Create one?"
                  recentOptions={recentSizes}
                  isLoading={sizesLoading}
                />
                
                <div>
                  {selectedSize && (
                    <p className="text-sm text-muted-foreground">
                      Selected size: {selectedSize}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Available Sizes</CardTitle>
                <CardDescription>
                  List of all sizes in the database
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {sizesLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : sizeOptions.length > 0 ? (
                  <ul className="space-y-2">
                    {sizeOptions.map((size) => (
                      <li key={size.value} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                        <span>{size.label}</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setSelectedSize(size.value)}
                        >
                          Select
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-center text-muted-foreground py-4">No sizes available</p>
                )}
                
                <Button onClick={handleRefresh} className="w-full">
                  Refresh Sizes
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
